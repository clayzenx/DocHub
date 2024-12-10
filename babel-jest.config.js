module.exports = {
  presets: [
    ['@babel/preset-typescript', { 'onlyRemoveTypeImports': true }],
    '@vue/cli-plugin-babel/preset',
    '@babel/preset-env'
  ],
  plugins: [
    '@babel/plugin-proposal-class-properties',
    '@babel/proposal-object-rest-spread',
    '@babel/transform-runtime',
    'babel-plugin-transform-import-meta',
    ['prismjs', {
      'languages': 'all',
      'theme': 'default',
      'css': true
    }]
  ]
};
