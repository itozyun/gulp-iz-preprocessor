# gulp-iz-preprocessor

Cooment-based preprocessor.

## Install

~~~bat
npm install gulp-iz-preprocessor --save-dev
~~~

## Overview of Cooment-based preprocessor

1. Build for each targets
2. Definition of importable and import.
3. Move code blocks for optimized build.

---

## 1. Build for each targets
### src.js
1. Wrap if-block by remove range( `//_{` ~ `//_}` ).
2. Then define target ranges( `//_{@XX` ~ `//_}@XX` ). 

~~~js
//_{
if(UA.PC){
    //_{@PC
        console.log('I am PC.');
    //_}@PC
} else if(UA.iOS){
    //_{@iOS
        console.log('I am iOS.');
    //_}@iOS
} else {
    //_{@Android
        console.log('I am Android.');
    //_}@Android
};
//_}
~~~

You will get those 3 files.

PC.js
~~~js
//_{@PC
    console.log('I am PC.');
//_}@PC
~~~

iOS.js
~~~js
//_{@iOS
    console.log('I am iOS.');
//_}@iOS
~~~

Android.js
~~~js
//_{@Android
    console.log('I am Android.');
//_}@Android
~~~

## 2. Importable definition and import

### Importable definition at library.js.
~~~js
//_{+ajax
    console.log('Implementation of Ajax.');
//_}+ajax
~~~

### Import at main.js.
~~~js
//!ajax

function main(){
    console.log('I can call Ajax!');
};
~~~

## 3. Move code blocks for optimized build.

### Move to top

Collecting to the top for optimized build.
For example, Collect each @enum definitions for [Closure Compiler](https://developers.google.com/closure/compiler/).  

~~~js
//_<top
    /**
    * @enum {number}
    */
    project.TriState = {
        TRUE  : 1,
        FALSE : -1,
        MAYBE : 0
    };
//_>top
~~~

### Move to bottom
Collecting to the bottom for optimized build.
For example, Collect each @media blocks for [Clean CSS](https://github.com/jakubpawlowicz/clean-css).  

~~~css
h1 { background : #000; }

/* //_<bottom99 */
    @media print {h1 { background : #fff; }}
/* //_>bottom99 */

h1 { color : red; }

/* //_<bottom50 */
    @media handheld, only screen and (max-width: 479px) {h1 { color : green; }}
/* //_>bottom50 */

/* //_<bottom99 */
    @media print {h1 { color : #000; }}
/* //_>bottom99 */
~~~

~~~css
h1 { background : #000; }
h1 { color : red; }

/* //_<bottom50 */
    @media handheld, only screen and (max-width: 479px) {h1 { color : green; }}
/* //_>bottom50 */

/* //_<bottom99 */
    @media print {h1 { background : #fff; }}
/* //_>bottom99 */
/* //_<bottom99 */
    @media print {h1 { color : #000; }}
/* //_>bottom99 */
~~~

---

## Extended comments
### Definitions
| Extended comments          | Name                      | Description              |
|:---------------------------|:--------------------------|:-------------------------|
| `//@PC`                    | Build target definition   |                          |
| `//#mobile[@iOS,#WinMobi]` | Group definition          | //#xx[<@xx/#xx>, ...]    |
| `//+XHR`                   | Importable definition     |                          |
| `//+ajax[+XHR,+MSXML]`     | Importable with dependent | //+xx[+xx, ...]          |
| `//!ajax`                  | Import                    |                          |

### Range
| Extended comments          | Name                             | Description              |
|:---------------------------|:---------------------------------|:-------------------------|
| `//_{`                     | Remove range                     | remove                   |
| `//_{@PC`                  | Target range                     | keep if @PC              |
| `//_{#mobile`              | Group  range                     | keep if #mobile          |
| `//_{@PC,#mobile`          | Multi targets range              | //_{<@xx/#xx>, ...       |
| `//_{+ajax`                | Importable range                 | keep if "+ajax" imported |
| `//_{^@iOS`                | Not range                        | keep without @iOS        |
| `//_<top`                  | Move to top range                | move to top for optimized builds |
| `//_<bottom50`             | Move to bottom range             | `//_<bottom(Order:0~100)` move to bottom for optimized builds |

---

## Usage in gulp task

~~~js
const gulp   = require('gulp'),
      output = './public/css';
/* -------------------------------------------------------
 *  gulp css
 */
const izpp     = require('gulp-iz-preprocessor'),
      sass     = require("gulp-sass"),
      gcmq     = require("gulp-group-css-media-queries"),
      cleanCSS = require("gulp-clean-css");

gulp.task('css', function(){
    return gulp.src([
            "./Library/src/scss/**/*.scss",
            "./src/scss/**/*.scss"
        ])
        .pipe(
            izpp({
                fileType : 'scss',
                log      : false,
                tasks : [
                    { name : 'desktop', imports : [ 'desktopOnly' ], dir : 'pc'  },
                    { name : 'mobile' , imports : [ 'mobileOnly'  ], dir : 'mob' }
                ]
            })
        )
        .pipe(sass())
        .pipe(gcmq())
        .pipe(cleanCSS())
        .pipe(gulp.dest(output));
});
~~~

## Initialization options

| Name       | Type                  | Description        | Optional |
|:-----------|:----------------------|:-------------------|:---------|
| `fileType` | String                | extname            |          |
| `log`      | Boolean               | Show console.log() | v        |
| `tasks`    | Array.\<Task object\> | Task object array  | v        |


### Task object

| Name      | Type             | Description             | Optional |
|:----------|:-----------------|:------------------------|:---------|
| `name`    | String           | Task name for log       | v        |
| `imports` | Array.\<String\> | `[ "Ajax" ]`            | v        |
| `dir`     | String           | Output file directory   | v(*1)    |
| `prefix`  | String           | Output file name prefix | v(*1)    |

1. When registering two or more tasks, dir or prefix must be specified. If not specified, later tasks will overwrite earlier tasks. Only files for later tasks are output!

## Links

1. Previous version : [iz preprocessor](https://marketplace.visualstudio.com/items?itemName=itozyun.iz-preprocessor) VS Code extenshon

## Projects in use

1. [web-doc-base](https://github.com/itozyun/web-doc-base) "Super project for itozyun's Web document projects"
2. [OutCloud](http://outcloud.blogspot.com/) "itozyun's blog"

**Enjoy!**