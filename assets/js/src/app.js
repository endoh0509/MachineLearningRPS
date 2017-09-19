/**
 * Created by katsuya on 2017/08/17.
 */

(() => {
// ***** Machine learning *****

    const types = ['rk', 'sc', 'sn', 'pp', 'al'];

    const options = {
        filepaths: {
            model: 'assets/model/rps_model.json',
            weights: 'assets/model/rps_model_weights.buf',
            metadata: 'assets/model/rps_model_metadata.json'
        },
        gpu: true
    };
    const model1 = new KerasJS.Model(options);
    const model2 = new KerasJS.Model(options);

    // ***** Leap ******
    Leap.loop({
        frame: (frame) => {
            if (frame.hands.length === 2 && frame.historyIdx % 10 === 0) {
                // console.log(frame);
                Promise.all([
                    checkHand(frame.hands[0], 0, model1),
                    checkHand(frame.hands[1], 1, model2)
                ]).then((result) => {
                    // TODO
                    console.log(result);
                    let ary = [0, 1, 2, 3, 4];
                    let centerIdx = Math.ceil(ary.length / 2);
                    shiftLeft(ary, centerIdx - result[0]);
                }).catch((err) => {
                    console.log(err);
                });
            }
        },
        // hand: checkHand
    }).use('riggedHand', {
        materialOptions: {
            color: new THREE.Color(0xff0000)
        }
    }).use('handEntry', function () {
    }).on('handLost', function (hand) {
    });

    checkHand = (hand, handIdx, model) => {
        return new Promise((resolve, reject) => {
            model.ready().then(
                () => {
                    const data = calcJointsDist(hand);
                    const inputData = {
                        'input': new Float32Array(data)
                    };
                    return model.predict(inputData)
                }).then(
                (outputData) => {
                    let max = 0;
                    let maxIdx = 0;
                    for (let i = 0; i < outputData.output.length; i++) {
                        if (max < outputData.output[i]) {
                            maxIdx = i;
                            max = outputData.output[i];
                        }
                    }
                    return resolve(maxIdx);
                }).catch(
                (err) => {
                    reject(err);
                });
        });
    };

    judge = (type) => {
        console.log('---------');
        // console.log(types[type]);
        // console.log(types);
        const center = Math.floor(types.length / 2);
        // console.log(center - type);
        const l = shiftLeft(types, type - center);
        // console.log(l);
        // console.log(l.slice(0, center), l.slice(center + 1, l.length));
        return {
            'lose': l.slice(0, center),
            'win': l.slice(center + 1, l.length)
        }
    };

    calcJointsDist = (hand) => {
        let dists = [];
        for (let i = 0; i < hand.fingers.length - 1; i++) {
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
        return data;
    };

    calc_distance = (v1, v2) => {
        let dx = v1[0] - v2[0];
        let dy = v1[1] - v2[1];
        let dz = v1[2] - v2[2];
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    };

    shiftLeft = (src, n = 1) => {
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
    };

    let inArr = [0, 1, 2, 3, 4];
    console.log(inArr);
    let outArr = shiftLeft(inArr, 1);
    console.log('shift 3: ', outArr);
    outArr = shiftLeft(inArr, -1);
    console.log('shift -1: ', outArr);
})();
