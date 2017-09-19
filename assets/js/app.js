'use strict';

/**
 * Created by katsuya on 2017/08/17.
 */

(function () {
    // ***** Machine learning *****

    var types = ['rk', 'sc', 'sn', 'pp', 'al'];

    var options = {
        filepaths: {
            model: 'assets/model/rps_model.json',
            weights: 'assets/model/rps_model_weights.buf',
            metadata: 'assets/model/rps_model_metadata.json'
        },
        gpu: true
    };
    var model1 = new KerasJS.Model(options);
    var model2 = new KerasJS.Model(options);

    // ***** Leap ******
    Leap.loop({
        frame: function frame(_frame) {
            if (_frame.hands.length === 2 && _frame.historyIdx % 10 === 0) {
                // console.log(frame);
                Promise.all([checkHand(_frame.hands[0], 0, model1), checkHand(_frame.hands[1], 1, model2)]).then(function (result) {
                    // console.log(result);

                }).catch(function (err) {
                    console.log(err);
                });
            }
        }
        // hand: checkHand
    }).use('riggedHand', {
        materialOptions: {
            color: new THREE.Color(0xff0000)
        }
    }).use('handEntry', function () {}).on('handLost', function (hand) {});

    checkHand = function checkHand(hand, handIdx, model) {
        return new Promise(function (resolve, reject) {
            model.ready().then(function () {
                var data = calcJointsDist(hand);
                var inputData = {
                    'input': new Float32Array(data)
                };
                return model.predict(inputData);
            }).then(function (outputData) {
                var max = 0;
                var maxIdx = 0;
                for (var i = 0; i < outputData.output.length; i++) {
                    if (max < outputData.output[i]) {
                        maxIdx = i;
                        max = outputData.output[i];
                    }
                }
                return resolve(maxIdx);
                //handsType[handIdx] = maxIdx;
                shiftLeft();
            }).catch(function (err) {
                reject(err);
            });
        });
    };

    judge = function judge(type) {
        console.log('---------');
        // console.log(types[type]);
        // console.log(types);
        var center = Math.floor(types.length / 2);
        // console.log(center - type);
        var l = shiftLeft(types, type - center);
        // console.log(l);
        // console.log(l.slice(0, center), l.slice(center + 1, l.length));
        return {
            'lose': l.slice(0, center),
            'win': l.slice(center + 1, l.length)
        };
    };

    calcJointsDist = function calcJointsDist(hand) {
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

        for (var _y = 0; _y < dists.length; _y++) {
            for (var _x = 0; _x < dists.length; _x++) {
                newDists[_y][_x] = dists[_x][_y];
            }
        }

        var data = [];
        for (var _y2 = 0; _y2 < dists.length; _y2++) {
            for (var _x2 = 0; _x2 < dists.length; _x2++) {
                data.push(newDists[_y2][_x2]);
            }
        }
        return data;
    };

    calc_distance = function calc_distance(v1, v2) {
        var dx = v1[0] - v2[0];
        var dy = v1[1] - v2[1];
        var dz = v1[2] - v2[2];
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    };

    shiftLeft = function shiftLeft(src) {
        var n = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;

        var dst = src.concat();
        if (n < 0) {
            for (var i = 0; i < -n; i++) {
                dst.unshift(dst.pop());
            }
        } else {
            for (var _i = 0; _i < n; _i++) {
                dst.push(dst.shift());
            }
        }
        return dst;
    };

    var inArr = [0, 1, 2, 3, 4];
    console.log(inArr);
    var outArr = shiftLeft(inArr, 1);
    console.log('shift 3: ', outArr);
    outArr = shiftLeft(inArr, -1);
    console.log('shift -1: ', outArr);
})();