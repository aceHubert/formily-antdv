module.exports = (api) => {
  return {
    presets: [
      [
        '@babel/preset-env',
        {
          useBuiltIns: false,
          modules: api.env(['es'])
            ? false
            : api.env(['cjs'])
            ? 'commonjs'
            : 'auto',
        },
      ],
      [
        '@vue/babel-preset-jsx',
        {
          compositionAPI: 'vue-demi',
        },
      ],
      '@babel/preset-typescript',
    ],
    plugins: ['@babel/transform-runtime'],
  }
}
