const merge = require("webpack-merge");
const nodeExternals = require("webpack-node-externals");
const NodemonPlugin = require("nodemon-webpack-plugin");

/** @type import("webpack").Configuration */
const baseConfig = {
    mode: process.env.NODE_ENV || "development",
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: "ts-loader",
            },
        ],
    },
    resolve: {
        extensions: [".js", ".ts"],
        alias: {
            '~': `${__dirname}/src`
        }
    },
};
module.exports = [
    merge(baseConfig, {
        entry: "./src/server",
        output: {
            filename: "server.js",
            path: `${__dirname}/dist`,
        },
        target: "node",
        node: {
            // express 사용 시 이 설정 하지 않으면 실패함
            // 참고: https://medium.com/@binyamin/creating-a-node-express-webpack-app-with-dev-and-prod-builds-a4962ce51334
            __dirname: false,
            __filename: false,
        },
        externals: [
            // webpack에서 생성한 파일을 `node bundle.js` 로 실행할 경우
            // node_modules의 파일을 같이 번들하고 있을 필요는 없으므로
            // node_modules를 무시하고 외부함수로써 다루도록 번들시켜줌
            nodeExternals()
        ],
        plugins: [
            // node의 서버용 js 파일을 수정했을 시 자동으로 서버를 재실행 시켜줌
            // nodemon의 webpack용 플러그인
            new NodemonPlugin(),
        ],
    }),
];
