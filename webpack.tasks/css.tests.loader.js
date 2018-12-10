module.exports = [
    {
        test: /css$/,
        exclude: /node_modules/,
        use: ['css-loader', 'sass-loader']
    }
];
