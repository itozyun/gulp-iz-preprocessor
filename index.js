/**
 * https://qiita.com/morou/items/1297d5dd379ef013d46c
 *   gulpプラグインの基本構造（プラグイン開発者向け）
 */
const PluginError = require( 'plugin-error' ),
      Vinyl       = require( 'vinyl'        ),
      through     = require( 'through2'     );

/**
 * tasks : [ { imports [ "mobileLayout", "contactForm" ], dir : "css/mobile", name : "buildMobile" } ], fileType : "scss", log : true
 */
module.exports = function( options ){
    const SRC_FILE_MAP   = {},
          TGT_TEXT_LINES = [],
          _options       = options || {},
          TGT_FILE_TYPE  = _options.fileType,
          SHOW_LOG       = _options.log !== false,
          TASK_LIST      = _options.tasks || [ {} ];

    if( !TGT_FILE_TYPE ){
        this.emit( 'error', new PluginError( 'gulp-iz-preprocessor', 'No .fileType!' ) );
    };

    function transform( file, encoding, callback ){
        if( file.isNull() ){
            // this.push( file );
            return callback();
        };
        if( file.isStream() ){
            this.emit( 'error', new PluginError( 'gulp-iz-preprocessor', 'Streaming not supported' ) );
            return callback();
        };
        if( file.extname !== '.' + TGT_FILE_TYPE ){
            SHOW_LOG && console.log( '[' + TGT_FILE_TYPE + '] FileType is missmatch! Skipped. [' + file.basename + ']' );
            this.push( file );
            return callback();
        };

        var textLines = file.contents.toString( encoding ).split( '\r' ).join( '' )
                .split( String.fromCharCode( 65279 ) ).join( '' )  // Remove BOM
                .split( '\n' );

        if( textLines.length ){
            SRC_FILE_MAP[ file.path ] = textLines.length;
            TGT_TEXT_LINES.push.apply( TGT_TEXT_LINES, textLines );
        };
        SHOW_LOG && console.log( '[' + TGT_FILE_TYPE + '] ' + file.basename + ' ' + textLines.length + 'lines.' );
        callback();
    };

    function flush( callback ){
        const processor  = require( './iz-preprocessor.js' ),
              totalTasks = TASK_LIST.length;

        for( let i = 0, task, taskName; task = TASK_LIST[ i ]; ++i ){
            taskName = task.name || TGT_FILE_TYPE;
            try {
                var buildTargets = processor.collectExComments( TGT_TEXT_LINES, task.imports, SHOW_LOG ),
                    totalTargets = buildTargets.length;
            } catch( o_O ){
                let info = globalLineNumberToLocal( o_O.lineAt );
                this.emit( 'error', new PluginError( 'gulp-iz-preprocessor', o_O.message + '\n >> file:' + info.name + ' line at ' + info.lineAt + '. range:' + o_O.range ) );
                return callback();
            };

            for( let j = 0, path, text; buildTarget = buildTargets.shift() ; ++j ){
                path = './' + normalizationPath( task.dir ) + '/' + normalizationPath( task.prefix ) + buildTarget + '.' + TGT_FILE_TYPE;
                if( task.targets && task.targets.indexof( buildTarget ) === -1 ){
                    SHOW_LOG && console.log( '[' + taskName + ']' + ( j + 1 ) + '/' + totalTargets + ':[' + path + '] skiped.' );
                    continue;
                };
                SHOW_LOG && console.log( '[' + taskName + ']' + ( j + 1 ) + '/' + totalTargets + ':[' + path + ']' );

                text = processor.preCompile( TGT_TEXT_LINES, buildTarget, ( task.importFor || {} )[ buildTarget ], SHOW_LOG ).join( '\n' );
                this.push(new Vinyl({
                    // base     : './',
                    path     : path,
                    contents : Buffer.from( text )
                }));
            };
            SHOW_LOG && console.log( '[' + taskName + ']' + ( i + 1 ) + '/' + totalTasks + ': ------ done!' );
        };
        callback();
    };

    function normalizationPath( dirname ){
        const test = { '/' : 1, '\\' : 1  };

        if( !dirname ) return '';
        if( test[ dirname.charAt( 0 ) ] ) dirname = dirname.substr( 1 );
        if( test[ dirname.charAt( dirname.length - 1 ) ] ) dirname = dirname.substr( 0, dirname.length - 1 );

        return dirname;
    };

    function globalLineNumberToLocal( line ){
        var file, _line;

        for( file in SRC_FILE_MAP ){
            _line = line;
            line -= SRC_FILE_MAP[ file ];
            if( line <= 0 ) break;
        };
        return { name : file, lineAt : _line + 1 };
    };

    return through.obj( transform, flush );
};