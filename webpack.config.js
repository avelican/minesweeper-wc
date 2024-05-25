import { resolve as pathResolve } from "path";


const __dirname = import.meta.dirname;
// The following variables may appear to be global but are not. They exist only in the scope of CommonJS modules: __dirname. __filename.
// https://nodejs.org/api/globals.html

export default (env, argv) => {
	const config = {
		entry: './src/index.ts',
		output: {
			filename: 'bundle.js',
			path: pathResolve(__dirname, 'dist'),
		},
		resolve: {
			extensions: ['.ts', '.js']
		},
		module: {
			rules: [
				{
					test: /\.ts$/,
					use: 'ts-loader',
					exclude: /node_modules/,
				}
			]
		},
		mode: 'development',
	};
	console.log("config.mode:", config.mode);
	return config;
}