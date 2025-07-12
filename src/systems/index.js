/**
 * Rendering Systems - Module Loader
 *
 * This file provides a factory function to create a complete rendering system
 * by loading all the individual rendering components.
 */

/**
 * Convenience function to create a fully configured rendering system
 * @param {HTMLCanvasElement} canvas - The canvas element to render to
 * @param {Object} config - Configuration options for all renderers
 * @returns {Object} Object containing all configured rendering systems
 */
function createRenderingSystem(canvas, config = {}) {
  const { rendererConfig = {}, backgroundConfig = {}, effectsConfig = {}, uiConfig = {} } = config;

  // Create individual rendering systems
  const renderer = new Renderer(canvas, rendererConfig);
  const backgroundRenderer = new BackgroundRenderer(canvas, backgroundConfig);
  const effectsRenderer = new EffectsRenderer(effectsConfig);
  const uiRenderer = new UIRenderer(uiConfig);

  // Initialize the main renderer with subsystems
  renderer.init(backgroundRenderer, effectsRenderer, uiRenderer);

  return {
    renderer,
    backgroundRenderer,
    effectsRenderer,
    uiRenderer
  };
}

/**
 * Default configuration presets for different visual styles
 */
const RenderingPresets = {
  // Classic neon retro style
  retro: {
    backgroundConfig: {
      gridColor: 'rgba(0, 255, 0, 0.08)',
      gridDotColor: 'rgba(0, 255, 0, 0.15)',
      scanLineColor: 'rgba(0, 255, 255, 0.03)',
      starAlphaMultiplier: 0.6
    },
    uiConfig: {
      hudColor: '#0f0',
      titleColor: '#f00',
      highlightColor: '#ff0'
    }
  },

  // Modern minimal style
  minimal: {
    backgroundConfig: {
      gridColor: 'rgba(255, 255, 255, 0.03)',
      gridDotColor: 'rgba(255, 255, 255, 0.05)',
      scanLineColor: 'rgba(255, 255, 255, 0.01)',
      starAlphaMultiplier: 0.3
    },
    uiConfig: {
      hudColor: '#fff',
      titleColor: '#f44',
      highlightColor: '#4f4'
    }
  },

  // High contrast accessibility style
  accessible: {
    backgroundConfig: {
      gridColor: 'rgba(255, 255, 255, 0.1)',
      gridDotColor: 'rgba(255, 255, 255, 0.2)',
      scanLineColor: 'rgba(255, 255, 255, 0.05)',
      starAlphaMultiplier: 0.8
    },
    uiConfig: {
      hudColor: '#fff',
      titleColor: '#ff0000',
      highlightColor: '#ffff00'
    }
  }
};

// Export for module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createRenderingSystem,
    RenderingPresets
  };
}
