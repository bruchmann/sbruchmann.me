import compression from "compression";
import { createServer } from "node:http";
import express from "express";
import favicon from "express-favicon";
import { dirname as getDirectoryName, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";
import helmet from "helmet";
import { readFileSync } from "node:fs";
import phrases from "./data/phrases.json" with { type: "json" };

function randomRange(min, max) {
	return Math.random() * (max - min) + min;
}

function sample(array) {
	return array[Math.round(randomRange(0, array.length - 1))];
}

function makeSampler(array) {
	let pool = [];

	function refill() {
		pool = [...array].sort(() => Math.random() - 0.5);
	}

	refill();

	return function take() {
		if (pool.length === 0) refill();
		return pool.pop();
	};
}

process.on("uncaughtException", (err) => {
	console.error(err);
	process.exit(1);
});

process.on("unhandledRejection", (err) => {
	console.error(err);
	process.exit(1);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = getDirectoryName(__filename);

const indexTemplate = readFileSync("./views/index.html", "utf8");
const getPhrase = makeSampler(phrases);
function index(req, res, next) {
	const indexBody = indexTemplate.replace(/\{\{phrase\}\}/, getPhrase());

	res.writeHead(200, {
		"Content-Length": Buffer.byteLength(indexBody),
		"Content-Type": "text/html",
	});
	res.end(indexBody);
}

const app = express();
app.use(compression());
app.use(
	helmet.contentSecurityPolicy({
		useDefaults: true,
		directives: {
			"script-src": ["'self'", "sbruchmann.me"],
			"style-src": null,
		},
	}),
);

app.use(favicon(resolvePath(__dirname, "public", "favicon.png")));
app.get("/", index);

app.use(express.static(resolvePath(__dirname, "public")));

const port = process.env.PORT || 3000;
const server = createServer(app);
server.listen(port, (err) => {
	if (err) {
		console.error(err);
		process.exit(1);
	} else {
		console.log(`Listening on port ${port}`);
	}
});
