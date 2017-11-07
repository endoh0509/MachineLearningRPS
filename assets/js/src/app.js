'use strict';

/**
 * Created by katsuya on 2017/08/17.
 */

import Leap from 'leapjs';
import plugin from 'leapjs-plugins';
import THREE from 'three';

window.onload = () => {

    // all units in mm
    var initScene = function () {
        window.scene = new THREE.Scene();
        window.renderer = new THREE.WebGLRenderer({
            alpha: true
        });
        window.renderer.setClearColor(0x000000, 0);
        window.renderer.setSize(window.innerWidth, window.innerHeight);
        window.renderer.domElement.style.position = 'fixed';
        window.renderer.domElement.style.top = 0;
        window.renderer.domElement.style.left = 0;
        window.renderer.domElement.style.width = '100%';
        window.renderer.domElement.style.height = '100%';
        document.body.appendChild(window.renderer.domElement);
        var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(0, 0.5, 1);
        window.scene.add(directionalLight);
        window.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
        window.camera.position.fromArray([0, 100, 500]);
        window.camera.lookAt(new THREE.Vector3(0, 160, 0));
        window.addEventListener('resize', function () {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.render(scene, camera);
        }, false);
        // var geometry = new THREE.CubeGeometry(30, 45, 10);
        // var material = new THREE.MeshPhongMaterial({color: 0x0000cc});
        // window.cube = new THREE.Mesh(geometry, material);
        // cube.position.set(0, 0, 0);
        // cube.castShadow = true;
        // cube.receiveShadow = true;
        // scene.add(cube);
        renderer.render(scene, camera);
    };
    initScene();

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
                    console.log(shiftLeft(ary, centerIdx - result[0]));
                    // var zeroIsWin = shiftLeft(ary, centerIdx - result[0]).indexOf(result[1]);
                    let zeroIsWin = judge(result[0]).win.indexOf(result[1]) > 0;
                    console.log(zeroIsWin);
                    frame.hands.forEach(function (hand, index, array) {
                        let color = 0x000000;
                        if (result[0] === result[1]) {
                            color = 0x000000;
                        } else if (zeroIsWin && index === 0) {
                            color = 0xff0000;
                        } else if (!zeroIsWin && index === 1) {
                            color = 0xff0000;
                        }
                        drawHand(scene, hand, index, color);
                    });
                }).catch((err) => {
                    console.log(err);
                });
            }
        },
    })
        .use('handEntry', function () {
        })
        .on('handLost', function (hand) {
        });
};

// class Finger {
//     constructor(scene, joints) {
//         this.scene = scene;
//         this.joints = joints;
//         this.object = null;
//     }
//
//     draw() {
//         if (scene.getObjectByName(this.object.name)) {
//             scene.remove(this.object);
//         }
//
//         let material = new THREE.LineBasicMaterial({
//             color: 0x0000ff
//         });
//         let geometry = new THREE.Geometry();
//         this.joints.forEach(function (jointVec) {
//             geometry.vertices.push(new THREE.Vector3(jointVec[0], jointVec[1], jointVec[2]));
//         });
//         scene.add(this.object);
//         renderer.render(scene, camera);
//     }
// }
//
// class Hand {
//     constructor(scene, fingers) {
//         this.scene = scene;
//         this.fingers = fingers;
//         this.object = null;
//     }
//
//     draw() {
//         this.fingers.forEach(function (finger) {
//             finger.draw();
//         });
//     }
// }

const getJointsVectors = (finger) => {
    let jointsVectors = [];
    finger.bones.forEach(function (bone) {
        let nextJoint = bone.nextJoint;
        let prevJoint = bone.prevJoint;
        jointsVectors.push(nextJoint);
    });
    return jointsVectors;
};

const getFingerVectors = (hand) => {
    let fingerVectors = [];
    hand.fingers.forEach(function (finger) {
        fingerVectors.push(getJointsVectors(finger));
    });
    return fingerVectors;
};

let myHands = [];

const drawHand = (scene, hand, index, color = 0x000000) => {

    let material = new THREE.LineBasicMaterial({
        color: color
    });
    let geometry = new THREE.Geometry();
    // joints.forEach(function (jointVec) {
    //     geometry.vertices.push(new THREE.Vector3(jointVec[0], jointVec[1], jointVec[2]));
    // });
    getFingerVectors(hand).forEach(function (fingerVecs) {
        fingerVecs.forEach(function (jointVec) {
            geometry.vertices.push(new THREE.Vector3(jointVec[0], jointVec[1], jointVec[2]));
        });
    });

    let line = new THREE.Line(geometry, material);
    if (myHands.length === 2) {
        scene.remove(myHands[index]);
        myHands[index] = line;
    } else {
        myHands.push(line);
    }
    scene.add(myHands[index]);
    renderer.render(scene, camera);


    // getFingerVectors(hand).forEach(function (fingerVector, handIndex) {
    //     let fingers = [];
    //     getJointsVectors(fingerVector).forEachChunk(function (jointsVector) {
    //         fingers.push(new Finger(scene, jointsVector));
    //     });
    //     if(myHands.length === 2){
    //         myHands.push(new Hand(scene, fingers));
    //     }else{
    //         myHands[index] = new Hand(scene, fingers);
    //     }
    // });
    // myHands.forEach(function (hand) {
    //     hand.draw();
    // });
};

const checkHand = (hand, handIdx, model) => {
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

const calcJointsDist = (hand) => {
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

const calc_distance = (v1, v2) => {
    let dx = v1[0] - v2[0];
    let dy = v1[1] - v2[1];
    let dz = v1[2] - v2[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

let types = [0, 1, 2, 3, 4];
const judge = (type) => {
    const center = Math.floor(types.length / 2);
    const l = shiftLeft(types, type - center);
    return {
        'lose': l.slice(0, center),
        'win': l.slice(center + 1, l.length)
    }
};

const shiftLeft = (src, n = 1) => {
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

