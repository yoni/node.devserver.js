var fs    = require('fs'),
    sys   = require('sys'),
    spawn = require('child_process').spawn;

var server;
var child_js_file = process.ARGV[2];
var current_dir = __filename.split('/');
current_dir = current_dir.slice(0, current_dir.length-1).join('/');

var start_server = function(){
    server = spawn('node', [child_js_file]);
    function pass_along(data){
        if (data !== null) sys.print(data);
    }
    server.addListener('output', pass_along);
    server.addListener('error', pass_along);
    sys.puts('server started');
};

var restart_server = function(){
    sys.puts('change discovered, restarting server');
    server.kill('SIGHUP');
    setTimeout(start_server, 500);
};

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

