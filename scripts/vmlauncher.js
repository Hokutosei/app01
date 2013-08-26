var sys = require('sys')
    , exec = require('child_process').exec
    , myUtils = require('.././utils')
    , log = function(str) { myUtils.log(str) };


var execution = 'start';

var virtualMachines = [
                        //29
                        'jeanepaul-main-redis'
                        //26
                        , 'jeanepaul-node1'
                        //24
                        , 'jeanepaul-redis1-vm1'
                        //27
                        , 'jeanepaul-redis2'
                        //28
                        , 'jeanepaul-redis3'
                        //25
                        , 'johnpaul-vm1a'
                        ];

//var virtualMachines = ['jeanepaul-redis3', 'jeanepaul-node1', 'jeanepaul-redis1-vm1'];


function puts(error, stdout, stderr) { sys.puts(stdout)};

(function loopThrough(i) {
    setTimeout(function() {
        log(virtualMachines[i - 1]);
        var x = 'virsh ' + execution + ' ' + virtualMachines[i - 1];
        exec(x.toString(), puts);
        if(--i) loopThrough(i);
    }, 3000)
})(virtualMachines.length)