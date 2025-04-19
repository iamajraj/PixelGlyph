tailwind.config = {
  theme: {
      extend: {
          colors: {
              'brand-base': '#08080c',
              'brand-surface': '#111117',
              'brand-surface-alt': '#18181f',
              'brand-stroke': '#282830',
              'brand-stroke-light': '#40404f',
              'brand-light': '#dcdfe4', /* Primary text */
              'brand-medium': '#c0c0d0', /* Output text */
              'brand-muted': '#9090a0', /* Secondary text */
              'brand-accent': '#00ffff', /* Cyan */
              'brand-accent-light': '#5fffff',
              'brand-accent-dark': '#00e6e6',
          },
          fontFamily: {
              'sans': ['Space Grotesk', 'sans-serif'],
              'mono': ['Roboto Mono', 'monospace']
          },
      }
  }
}