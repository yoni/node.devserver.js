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

function restart_server () {
    // make sure we only send a kill signal once
    if(server != null) { 
        sys.puts('Change discovered, restarting server');
        server.kill('SIGHUP');
        server = null;
    }
}

function onServerExit(exitCode) {
    sys.puts('Server process exited with code ' + exitCode);
    start_server();
}

function pass_along(data){
    if (data !== null) sys.print(data);
}

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
                else if (stats.isFile())
                    fs.watchFile(file_for_callback, restart_server);
            });
        })();
    }

}

fs.readdir(current_dir, function (err, files) {
    if(err) throw 'Could not load files in the current directory. ' + err;
    parse_file_list(current_dir, files);
});

start_server();

