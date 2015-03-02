
require ("colors");
require ("gulp-livereload");

var app = {
	autoprefixer: require("gulp-autoprefixer"),
	concat: require("gulp-concat"),
	connect: require("gulp-connect"),
	date: require("dateformat"),
	fs: require("fs"),
	gulp: require("gulp"),
	minifyCSS: require("gulp-minify-css"),
	minifyJS: require("gulp-jsmin"),
	path: require("path"),
	rename: require("gulp-rename"),
	sass: require("gulp-sass"),
	scandir: require("files-finder"),
};

var compress  = false;

function toLog(message){
	message = app.date(new Date(), "[dd.mm.yyyy h:MM:ss]") + " " + message;
	console.log(message.green);
}

var directories = {
	"module": "project/source/html/module",
	"layout": "project/source/html",
	"smacss": {
		"root": "project/source/scss",
		"folder": [
			"project/source/scss/base/*.scss",
			"project/source/scss/layout/*.scss",
			"project/source/scss/module/*.scss",
			"project/source/scss/state/*.scss",
			"project/source/scss/utils/*.scss",
		]
	},
	"script" : "project/source/js",
	"www": "project/www",
	"css": "project/www/css",
	"js": "project/www/js"
};


/*
Задача для склеивания layout + content
 */
app.gulp.task("html", function(){
	var files = app.scandir(directories.module, /(html)$/);
	for (var i=0; i<files.length; i++){
		var concat = [];
		if (app.fs.existsSync(directories.layout + "/_header.html"))
			concat.push(directories.layout + "/_header.html");
		if (app.fs.existsSync(files[i]))
			concat.push(files[i]);
		if (app.fs.existsSync(directories.layout + "/_footer.html"))
			concat.push(directories.layout + "/_footer.html");
		var filename = app.path.basename(files[i]).substr(1);
		app.gulp.src(concat)
		   .pipe(app.concat(filename))
		   .pipe(app.gulp.dest(directories.www));
	}
	app.gulp.src(directories.www)
	   .pipe(app.connect.reload());
	toLog("HTML concat!");
});

app.gulp.task("scss", function(){
	if (app.fs.existsSync(directories.smacss.root + "/style.scss")){
		var sass = app.gulp.src(directories.smacss.root + "/style.scss")
		   .pipe(app.sass())
		   .pipe(app.autoprefixer({
		       browsers: ["last 15 versions", "> 1%", "ie 9"],
		   }))
		   .pipe(app.gulp.dest(directories.css));
		if (compress){
			sass.pipe(app.minifyCSS())
				.pipe(app.rename({suffix: ".min"}))
				.pipe(app.gulp.dest(directories.css));
			console.log("SASS compress!");
		}else
			sass.pipe(
				app.connect.reload()
			);
	}
	toLog("SASS compile!");
});

app.gulp.task("js", function(){
	var files = app.scandir(directories.script, /(js)$/);
	if (files.length){
		var js = app.gulp.src(files)
		   .pipe(app.concat("application.js"))
		   .pipe(app.gulp.dest(directories.js));
		toLog("JS concat!");
		if (compress){
			js.pipe(app.minifyJS())
			  .pipe(app.rename({suffix: ".min"}))
			  .pipe(app.gulp.dest(directories.js));
			toLog("JS compress!");
		}else
			js.pipe(
				app.connect.reload()
			);
	}
});

app.gulp.task("connect", function(){
	toLog("Server run to localhost:7700");
	app.connect.server({
		livereload: true,
		port: 7700,
		root: directories.www
	});
});

app.gulp.task("watch", function(){
	toLog("Application start");
	app.gulp.watch([directories.layout + "/*", directories.module + "/*.html"], ["html"]);
	app.gulp.watch(directories.smacss.folder, ["scss"]);
	app.gulp.watch(directories.script + "/*.js", ["js"]);
});

app.gulp.task("default", ["connect", "watch"]);

app.gulp.task("compress", function(){
	compress = true;
	app.gulp.run("scss");
	app.gulp.run("js");
});
