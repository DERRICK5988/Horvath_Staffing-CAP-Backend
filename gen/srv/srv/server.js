// const proxy = require('@cap-js-community/odata-v2-adapter');
// const cds = require('@sap/cds');
// const passport = require("passport");
// const xsenv = require("@sap/xsenv");
// const cors = require("cors");

// var xsuaaCredentials = false;
// if (process.env.NODE_ENV === "production") {
// 	try {
// 		xsenv.loadEnv();
// 		const JWTStrategy = require("@sap/xssec").JWTStrategy;
// 		const services = xsenv.getServices({
// 			xsuaa: {
// 				tags: "xsuaa"
// 			}
// 		});
// 		xsuaaCredentials = services.xsuaa;
// 		const jwtStrategy = new JWTStrategy(xsuaaCredentials);
// 		passport.use(jwtStrategy);
// 	} catch (error) {
// 		console.warn(error.message);
// 	}
// }


// // Middleware to read JWT sent by client
// // function jwtLogger(req, res, next) {
// // 	console.log("===> Decoding auth header");
// // 	const jwtToken = readJwt(req);
// // 	if (jwtToken) {
// // 		console.log("===> JWT: scopes: " + jwtToken.scope);
// // 		console.log("===> JWT: client_id: " + jwtToken.client_id);
// // 		console.log("===> JWT: user: " + jwtToken.user_name);
// // 	}

// // 	next();
// // }

// // const readJwt = function (req) {
// // 	const authHeader = req.headers.authorization;
// // 	if (authHeader) {
// // 		const theJwtToken = authHeader.substring(7);
// // 		if (theJwtToken) {
// // 			console.log("===> JWT Token: " + theJwtToken);
// // 			const jwtBase64Encoded = theJwtToken.split(".")[1];
// // 			if (jwtBase64Encoded) {
// // 				const jwtDecoded = Buffer.from(jwtBase64Encoded, "base64").toString(
// // 					"ascii"
// // 				);
// // 				return JSON.parse(jwtDecoded);
// // 			}
// // 		}
// // 	}
// // };

// cds.on("bootstrap", async (app) => {
// 	// Bind to express app
// 	app.use(proxy());

// 	// Disable cors
// 	app.use(cors());

// 	// Authentication using JWT
// 	if (process.env.NODE_ENV === "production") {
// 		// app.use(jwtLogger);
// 		await app.use(passport.initialize());
// 		await app.use(passport.authenticate("JWT", {
// 			session: false
// 		}));
// 	}
// });

// // Swagger / OpenAPI
// if (process.env.NODE_ENV !== "production") {
// 	const cds_swagger = require("cds-swagger-ui-express");
// 	cds.on("bootstrap", (app) => app.use(cds_swagger()));
// }

// module.exports = cds.server;