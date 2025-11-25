# Fashion Styling Platform

A modern, responsive fashion and grooming styling platform with AI-powered outfit recommendations and virtual try-on capabilities.

## Project Overview

This is a front-end only project built for a design contest. It features:
- Dual theme support (Light/Dark mode)
- Outfit generation and recommendations
- Model preview system for outfits and hairstyles
- Product browsing with advanced filtering
- Responsive design inspired by Zalora and Made by Fade

## Technology Stack

- **HTML5** - Semantic structure
- **CSS3** - Custom styles and animations
- **Tailwind CSS** - Utility-first CSS framework
- **Vanilla JavaScript** - No frameworks, pure JS
- **Swiper.js** - Carousel components
- **AOS.js** - Scroll animations

## Project Structure

```
design-contest-code/
├── index.html              # Home page
├── pages/                  # All page files
├── assets/                 # Images, fonts, icons
│   ├── images/
│   │   ├── models/        # Base model silhouettes
│   │   ├── outfits/       # Transparent PNG outfits
│   │   ├── hairstyles/    # SVG/PNG hairstyles
│   │   └── products/      # Product images
│   ├── fonts/             # Custom fonts
│   └── icons/             # Icon assets
├── css/
│   ├── main.css           # Custom CSS + Tailwind directives
│   └── tailwind.css       # Generated Tailwind output
├── js/                    # JavaScript modules
│   ├── main.js            # Theme toggle, navigation
│   ├── outfit-generator.js
│   ├── model-preview.js
│   ├── recommendations.js
│   ├── filters.js
│   └── animations.js
├── libs/                  # Third-party libraries
├── config/
│   └── tailwind.config.js # Tailwind configuration
└── package.json
```

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Build Tailwind CSS**
   ```bash
   npm run build-css
   ```
   For production:
   ```bash
   npm run build-css-prod
   ```

3. **Open in Browser**
   - Simply open `index.html` in your browser
   - Or use a local server:
     ```bash
     npx serve .
     ```

## Design System

### Colors

**Light Mode:**
- Primary: Blue tones (#0ea5e9)
- Accent: Purple tones (#d946ef)
- Neutral: Gray scale

**Dark Mode:**
- Background: #0f0f0f
- Surface: #1a1a1a
- Card: #242424
- Text: #e5e5e5

### Typography

- **Itim** - Friendly titles/highlights
- **Rufina** - Elegant fashion headings
- **Orbit** - Soft captions/descriptions
- **Jomolhari** - Cultural/bold stylized headings

### Components

All components are defined in `css/main.css` using Tailwind's `@layer components`:
- Buttons (primary, secondary, ghost, accent)
- Product cards
- Filter UI
- Navigation
- Forms
- Modals

## Features

### Theme Toggle
- Persistent theme selection (localStorage)
- Smooth transitions
- System preference detection

### Outfit Generator
- Select items by category
- Generate outfit recommendations
- Save to favorites
- Activity history

### Model Preview
- Layer outfits on base model
- Hairstyle try-on
- Real-time preview updates

### Filtering System
- Category, size, color, brand filters
- Price range
- Sort options
- Search functionality

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development Notes

- All AI recommendations are simulated using rule-based logic (front-end only)
- No backend or database required
- Images should be added to respective asset folders
- Tailwind CSS must be compiled before viewing

## License

MIT License - Team Pyin Mal

