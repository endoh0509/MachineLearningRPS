module.exports = {
    // entry: ['babel-polyfill', './assets/js/src/app.js'],  // babel-polyfill はIE11などで必要
    entry: ['./assets/js/src/app.js'],  // babel-polyfill はIE11などで必要
    output: {
        path: __dirname,
        filename: './assets/js/bundle.js'
    },
    resolve: {
        extensions: ['.js']
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                query: {
                    presets: ['es2015']
                }
            }
        ]
    }
};