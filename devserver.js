var fs    = require('fs'),
    sys   = require('sys'),
    spawn = require('child_process').spawn;

var server;
var child_js_file = process.ARGV[2];
var current_dir = __filename.split('/');
current_dir = current_dir.slice(0, current_dir.length-1).join('/');

function start_server () {
    server = spawn('node', [child_js_file]);
    server.addListener('exit', onServerExit);
    server.addListener('output', pass_along);
    server.addListener('error', pass_along);
    sys.puts('server started');
}

function pass_along(data) {
    if (data !== null) sys.print(data);
}

function restart_server () {
    // make sure we only send a kill signal once
    if(server != null) { 
        sys.puts('Change discovered, restarting server');
        server.kill('SIGHUP');
        server = null;
    }
}

function onServerExit(exitCode) {
    if(exitCode) sys.puts('Server process exited with code ' + exitCode);
    start_server();
}

/**
 * A recursive directory parser.
 * Calls watch_file for each file it finds.
 * Calls itself for each directory it finds.
 */
function parse_file_list (dir, files) {

    for (var i = 0; i < files.length; i++) {
        var file = dir + '/' + files[i];
        (function(){
            var file_for_callback = file;
            fs.stat(file, function (err, stats) {
                if(err) throw 'Could not load file stat for ' + file + '. ' + err;
                if (stats.isDirectory())
                    fs.readdir(file_for_callback, function (err, files) {
                        if(err) throw 'Could not read file ' + file + '. ' + err; 
                        parse_file_list(file_for_callback, files);
                    });
                else if (stats.isFile()) {
                    watch_file(file_for_callback);
                }
            });
        })();
    }

}

// wathes files whose filename does not include a '.' and restarts the server whenever they change
function watch_file(file) {
    if(!file.match(/.+\/\..+/)) {
        sys.puts("  watching file: " + file);
        fs.watchFile(file, function (curr, prev) {
            if(new Date(curr.mtime).getTime() != new Date(prev.mtime).getTime()) { 
                restart_server();
            }
        });
    }
}

fs.readdir(current_dir, function (err, files) {
    if(err) throw 'Could not load files in the current directory. ' + err;
    parse_file_list(current_dir, files);
});

start_server();

