/**
 * Created by katsuya on 2017/08/17.
 */

(function () {
// ***** Machine learning *****

    let types = ['rk', 'sc', 'sn', 'pp', 'al'];
    const model = new KerasJS.Model({
        filepaths: {
            model: 'assets/model/rps_model.json',
            weights: 'assets/model/rps_model_weights.buf',
            metadata: 'assets/model/rps_model_metadata.json'
        },
        gpu: true
    });

// Alien data
    let testData = [69.95254, 96.487144, 67.54414, 78.87629, 54.044662, 39.390194, 41.38174, 37.162678, 53.23326, 76.017426, 57.780758,
        64.09712, 86.60876, 110.918495, 73.8812, 91.8778];
    let testDatas = [
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
    const test = model.ready().then(
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

    var handsType = [0, 0];
    // ***** Leap ******
    Leap.loop({
        frame: function (frame) {
            if (frame.hands.length == 2) {
                checkHand(frame.hands[0], 0);
                checkHand(frame.hands[1], 1);
                console.log(handsType);
            }
        },
        // hand: checkHand
    }).use('riggedHand', {
        materialOptions: {
            color: new THREE.Color(0xff0000)
        }
    }).use('handEntry', function () {
    })
        .on('handLost', function (hand) {
        });

    function checkHand(hand, handIdx) {
        let dists = [];
        for (var i = 0; i < hand.fingers.length - 1; i++) {
            let finger = hand.fingers[i];
            let nextFinger = hand.fingers[i + 1];
            let dmpt = [];
            let dip = finger.dipPosition;
            let nextDip = nextFinger.dipPosition;
            let dipDist = calc_distance(dip, nextDip);
            dmpt.push(dipDist);
            let mcp = finger.mcpPosition;
            let nextMcp = nextFinger.mcpPosition;
            let mcpDist = calc_distance(mcp, nextMcp);
            dmpt.push(mcpDist);
            let pip = finger.pipPosition;
            let nextPip = nextFinger.pipPosition;
            let pipDist = calc_distance(pip, nextPip);
            dmpt.push(pipDist);
            let tip = finger.tipPosition;
            let nextTip = nextFinger.tipPosition;
            let tipDist = calc_distance(tip, nextTip);
            dmpt.push(tipDist);
            dists.push(dmpt);
        }

        let newDists = [];
        for (let y = 0; y < dists.length; y++) {
            let row = [];
            for (let x = 0; x < dists.length; x++) {
                row.push(0);
            }
            newDists.push(row);
        }

        for (let y = 0; y < dists.length; y++) {
            for (let x = 0; x < dists.length; x++) {
                newDists[y][x] = dists[x][y];
            }
        }

        let data = [];
        for (let y = 0; y < dists.length; y++) {
            for (let x = 0; x < dists.length; x++) {
                data.push(newDists[y][x]);
            }
        }

        model.ready().then(
            function () {
                const inputData = {
                    'input': new Float32Array(data)
                };
                return model.predict(inputData)
            }).then(
            function (outputData) {
                console.log(outputData);
                let max = 0;
                let maxIdx = 0;
                for (let i = 0; i < outputData.output.length; i++) {
                    if (max < outputData.output[i]) {
                        maxIdx = i;
                        max = outputData.output[i];
                    }
                }
                handsType[handIdx] = maxIdx;
            }).catch(
            function (err) {
                console.log(err);
            });
    }

    function judge(type) {
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
        }
    }

    function calc_distance(v1, v2) {
        let dx = v1[0] - v2[0];
        let dy = v1[1] - v2[1];
        let dz = v1[2] - v2[2];
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    function shiftLeft(src, n = 1) {
        let dst = src.concat();
        if (n < 0) {
            for (let i = 0; i < -n; i++) {
                dst.unshift(dst.pop());
            }
        } else {
            for (let i = 0; i < n; i++) {
                dst.push(dst.shift());
            }
        }
        return dst;
    }

    let inArr = [0, 1, 2, 3, 4];
    console.log(inArr);
    let outArr = shiftLeft(inArr, 1);
    console.log('shift 3: ', outArr);
    outArr = shiftLeft(inArr, -1);
    console.log('shift -1: ', outArr);
}).call(this);


