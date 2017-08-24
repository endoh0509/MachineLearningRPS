/**
 * Created by katsuya on 2017/08/17.
 */

// ***** Machine learning *****

var type = ['rk', 'sc', 'sn', 'pp', 'al'];
const model = new KerasJS.Model({
    filepaths: {
        model: 'assets/model/rps_model.json',
        weights: 'assets/model/rps_model_weights.buf',
        metadata: 'assets/model/rps_model_metadata.json'
    },
    gpu: true
});

// Alien data
var testData = [69.95254, 96.487144, 67.54414, 78.87629, 54.044662, 39.390194, 41.38174, 37.162678, 53.23326, 76.017426, 57.780758,
    64.09712, 86.60876, 110.918495, 73.8812, 91.8778];
var testDatas = [
    [84.16389, 22.208298, 95.87912, 38.887985, 85.323845, 37.615242, 41.915462, 38.08003, 65.178444, 28.336594,
        75.83828, 37.989788, 107.72359, 18.471163, 109.08404, 37.9015],
    [69.95254, 96.487144, 67.54414, 78.87629, 54.044662, 39.390194, 41.38174, 37.162678, 53.23326, 76.017426, 57.780758,
        64.09712, 86.60876, 110.918495, 73.8812, 91.8778],
    [7.6365385, 13.617038, 24.820122, 34.5436, 71.15796, 35.58112, 34.29166, 27.334818, 30.47264, 20.91922, 36.525894,
        34.7772, 22.898218, 11.4161625, 17.587423, 29.517162],
    [99.93479, 60.198772, 96.131905, 30.686514, 104.602356, 26.535957, 30.998768, 26.711365, 91.10418, 48.473465,
        49.46987, 38.320534, 107.36905, 68.74588, 128.69547, 24.997162],
    [77.449356, 22.202202, 36.07757, 45.568035, 105.94916, 28.47569, 34.170326, 29.991508, 96.20407, 25.183619,
        34.053574, 37.190388, 76.825264, 21.531994, 39.08712, 44.918247]
];
var test = model.ready().then(
    function () {
        const inputData = {
            'input': new Float32Array(testData)
        };
        console.log(inputData);
        return model.predict(inputData)
    }).then(
    function (outputData) {
        console.log(outputData);
    }
).catch(
    function (err) {
        console.log(err);
    }
);


// ***** Leap ******
(window.controller = new Leap.Controller)
    .use('riggedHand')
    .connect();

Leap.loop(
    {
        frame: function (frame) {
        },
        hand: checkHand
    })
    .use('riggedHand')
    .use('handEntry')
    .on('handLost', function (hand) {
        var label = hand.data('label');
        if (label) {
            document.body.removeChild(label);
            hand.data({label: undefined});
        }
    });
// .use('playback', {
//     recording: './left-or-right-77fps.json.lz',
//     timeBetweenLoops: 1000
// }
// );

var riggedHandPlugin = Leap.loopController.plugins.riggedHand;

function checkHand(hand) {
    var dists = [];
    for (var i = 0; i < hand.fingers.length - 1; i++) {
        var finger = hand.fingers[i];
        var nextFinger = hand.fingers[i + 1];
        var dmpt = [];
        var dip = finger.dipPosition;
        var nextDip = nextFinger.dipPosition;
        var dipDist = calc_distance(dip, nextDip);
        dmpt.push(dipDist);
        var mcp = finger.mcpPosition;
        var nextMcp = nextFinger.mcpPosition;
        var mcpDist = calc_distance(mcp, nextMcp);
        dmpt.push(mcpDist);
        var pip = finger.pipPosition;
        var nextPip = nextFinger.pipPosition;
        var pipDist = calc_distance(pip, nextPip);
        dmpt.push(pipDist);
        var tip = finger.tipPosition;
        var nextTip = nextFinger.tipPosition;
        var tipDist = calc_distance(tip, nextTip);
        dmpt.push(tipDist);
        dists.push(dmpt);
    }

    var newDists = [];
    for (var y = 0; y < dists.length; y++) {
        var row = [];
        for (var x = 0; x < dists.length; x++) {
            row.push(0);
        }
        newDists.push(row);
    }

    for (var y = 0; y < dists.length; y++) {
        for (var x = 0; x < dists.length; x++) {
            newDists[y][x] = dists[x][y];
        }
    }

    var data = [];
    for (var y = 0; y < dists.length; y++) {
        for (var x = 0; x < dists.length; x++) {
            data.push(newDists[y][x]);
        }
    }

    var test = model.ready().then(
        function () {
            const inputData = {
                'input': new Float32Array(data)
            };
            return model.predict(inputData)
        }).then(
        function (outputData) {
            var max = 0;
            var maxIdx = 0;
            for (var i = 0; i < outputData.output.length; i++) {
                if (max < outputData.output[i]) {
                    maxIdx = i;
                    max = outputData.output[i];
                }
            }
            console.log(type[maxIdx]);
        }
    ).catch(
        function (err) {
            console.log(err);
        }
    );
}

function calc_distance(v1, v2) {
    var dx = v1[0] - v2[0];
    var dy = v1[1] - v2[1];
    var dz = v1[2] - v2[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function shiftLeft(src, n = 1) {
    var dst = src.concat();
    if (n < 0) {
        for(var i = 0; i < -n; i++) {
            dst.unshift(dst.pop());
        }
    } else {
        for(var i = 0; i < n; i++) {
            dst.push(dst.shift());
        }
    }
    return dst;
}

var inArr = [0, 1, 2, 3, 4];
console.log(inArr);
var outArr = shiftLeft(inArr, 1);
console.log('shift 3: ', outArr);
outArr = shiftLeft(inArr, -1);
console.log('shift -1: ', outArr);
