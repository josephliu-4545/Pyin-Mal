// Lightweight Model Preview controller for the current HTML structure
// - Works with #model-preview-container and #mannequin-base
// - Makes .outfit-layer and .hairstyle-layer draggable and scalable
// - Exposes window.modelPreview.reset() and .saveScreenshot()

class ModelPreview {
    constructor() {
        this.container = document.getElementById("model-preview-container");
        this.mannequinImg = document.getElementById("mannequin-base");

        // State
        this.currentOutfit = {};
        this.currentHairstyle = null;
        this.activeLayer = null;
        this.dragState = null;

        if (!this.container || !this.mannequinImg) {
            console.warn("[ModelPreview] Preview container or mannequin not found.");
            return;
        }

        // Make any existing layers interactive (e.g. if something is preloaded)
        this.initExistingLayers();

        // Watch for new outfit / hairstyle layers appended by applyOutfitLayer / applyHairstyleLayer
        this.initMutationObserver();

        // Global pointer listeners for dragging
        this.initGlobalListeners();
    }

    // --- Initialisation helpers -------------------------------------------

    initExistingLayers() {
        const layers = this.container.querySelectorAll(".outfit-layer, .hairstyle-layer");
        layers.forEach(layer => this.makeLayerInteractive(layer));
    }

    initMutationObserver() {
        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                mutation.addedNodes.forEach(node => {
                    if (!(node instanceof HTMLElement)) return;

                    // Directly-added layer
                    if (node.matches(".outfit-layer, .hairstyle-layer")) {
                        this.makeLayerInteractive(node);
                    }

                    // Layers added inside a wrapper
                    const nestedLayers = node.querySelectorAll?.(".outfit-layer, .hairstyle-layer");
                    nestedLayers?.forEach(el => this.makeLayerInteractive(el));
                });
            }
        });

        observer.observe(this.container, {
            childList: true,
            subtree: true
        });

        this.observer = observer;
    }

    initGlobalListeners() {
        window.addEventListener("pointermove", e => this.onPointerMove(e));
        window.addEventListener("pointerup", e => this.onPointerUp(e));
        window.addEventListener("pointercancel", e => this.onPointerUp(e));
    }

    // --- Layer interaction --------------------------------------------------

    makeLayerInteractive(layer) {
        // If the shared try-on utilities are present, they will handle
        // dragging, scaling and transform persistence. In that case we
        // skip binding our own handlers to avoid conflicting behavior.
        if (window && window.enableLayerDragging) {
            return;
        }
        // Initialise transform data if missing
        if (!layer.dataset.tx) {
            layer.dataset.tx = "0";
            layer.dataset.ty = "0";
            layer.dataset.scale = "1";
            layer.dataset.rotate = "0";
            this.applyTransform(layer);
        }

        // Ensure pointer events reach this layer
        layer.style.touchAction = "none";
        layer.style.cursor = "grab";
        layer.style.pointerEvents = "auto";

        // Avoid duplicate handlers: assign directly
        layer.onpointerdown = (event) => this.onPointerDown(event, layer);
        layer.onwheel = (event) => this.onWheel(event, layer);
    }

    onPointerDown(event, layer) {
        // Left button only
        if (event.button !== 0) return;

        event.preventDefault();
        event.stopPropagation();

        this.activeLayer = layer;

        const tx = parseFloat(layer.dataset.tx || "0");
        const ty = parseFloat(layer.dataset.ty || "0");

        this.dragState = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            startTx: tx,
            startTy: ty
        };

        try {
            layer.setPointerCapture(event.pointerId);
        } catch (e) {
            // Some browsers might complain, it's safe to ignore
        }

        layer.style.cursor = "grabbing";
    }

    onPointerMove(event) {
        if (!this.activeLayer || !this.dragState) return;
        if (event.pointerId !== this.dragState.pointerId) return;

        event.preventDefault();

        const dx = event.clientX - this.dragState.startX;
        const dy = event.clientY - this.dragState.startY;

        const newTx = this.dragState.startTx + dx;
        const newTy = this.dragState.startTy + dy;

        this.activeLayer.dataset.tx = String(newTx);
        this.activeLayer.dataset.ty = String(newTy);
        this.applyTransform(this.activeLayer);
    }

    onPointerUp(event) {
        if (!this.activeLayer || !this.dragState) return;
        if (event.pointerId !== this.dragState.pointerId) return;

        try {
            this.activeLayer.releasePointerCapture(event.pointerId);
        } catch (e) {
            // ignore
        }

        this.activeLayer.style.cursor = "grab";
        this.activeLayer = null;
        this.dragState = null;
    }

    onWheel(event, layer) {
        // Don’t interfere with browser zoom (Ctrl/Cmd + scroll)
        if (event.ctrlKey || event.metaKey) return;

        // Optional: make scaling feel “edit mode” only
        // Honor the global fitAdjustMode flag when it exists so
        // behavior matches the legacy try-on system.
        if (typeof window !== 'undefined' && window.fitAdjustMode === false) return;

        event.preventDefault();
        event.stopPropagation();

        let scale = parseFloat(layer.dataset.scale || "1");
        const factor = event.deltaY > 0 ? 0.95 : 1.05; // scroll down = smaller, up = bigger
        scale *= factor;

        // Clamp to a sensible range
        scale = Math.min(Math.max(scale, 0.4), 2.5);

        layer.dataset.scale = String(scale);
        this.applyTransform(layer);
    }

    applyTransform(layer) {
        const tx = parseFloat(layer.dataset.tx || "0");
        const ty = parseFloat(layer.dataset.ty || "0");
        const scale = parseFloat(layer.dataset.scale || "1");
        const rotate = parseFloat(layer.dataset.rotate || "0");

        layer.style.transform = `translate(${tx}px, ${ty}px) rotate(${rotate}deg) scale(${scale})`;
        layer.style.transformOrigin = "center center";
    }

    // --- Public API used by inline script ----------------------------------

    reset() {
        if (!this.container) return;

        const layers = this.container.querySelectorAll(".outfit-layer, .hairstyle-layer");
        layers.forEach(el => el.remove());

        this.activeLayer = null;
        this.dragState = null;
        this.currentOutfit = {};
        this.currentHairstyle = null;
    }

    async saveScreenshot() {
        if (!this.container) return;

        try {
            if (window.html2canvas) {
                const canvas = await window.html2canvas(this.container);
                const link = document.createElement("a");
                link.href = canvas.toDataURL("image/png");
                link.download = "pyinmal-model-preview.png";
                document.body.appendChild(link);
                link.click();
                link.remove();
            } else {
                console.warn("[ModelPreview] html2canvas not found; screenshot disabled.");
                alert("Screenshot feature is not available in this build.");
            }
        } catch (err) {
            console.error("[ModelPreview] Failed to save screenshot", err);
        }
    }

    // Stubs for backward compatibility (not strictly needed right now, but safe)
    updateOutfit(/* item */) {}
    updateHairstyle(/* item */) {}
}

// Expose a single global instance once DOM is ready
window.addEventListener("DOMContentLoaded", () => {
    window.modelPreview = new ModelPreview();
});
