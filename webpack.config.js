module.exports = {
    entry: ['./assets/js/src/app.js'],
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