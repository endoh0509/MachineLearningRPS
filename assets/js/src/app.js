'use strict';

/**
 * Created by katsuya on 2017/08/17.
 */

import Leap from 'leapjs';
import plugin from 'leapjs-plugins';
import THREE from 'three';
import $ from 'jquery';

window.onload = () => {
    // ***** Machine learning *****
    let types = [0, 1, 2, 3, 4];
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
    let baseBoneRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
    let renderer, scene, camera;
    /**
     *
     * Leapのコントローラ定義.
     *
     **/
    const leapController = new Leap.Controller();
    leapController.use('handHold').use('handEntry')
        .on('frame', (frame) => {
            if(frame.hands.length === 2) {
                Promise.all([
                    checkHand(frame.hands[0], 0, model1),
                    checkHand(frame.hands[1], 1, model2)
                ]).then((result) => {
                    let ary = [0, 1, 2, 3, 4];
                    let centerIdx = Math.ceil(ary.length / 2);
                    let zeroIsWin = judge(result[0]).win.indexOf(result[1]) > 0;
                    frame.hands.forEach((hand, index, array) => {
                        let color = 0xffffff;
                        if (result[0] === result[1]) {
                            color = 0xffffff;
                        } else if (zeroIsWin && index === 0) {
                            color = 0xff0000;
                        } else if (!zeroIsWin && index === 1) {
                            color = 0xff0000;
                        }
                        hand.fingers.forEach((finger) => {
                            finger.data('jointMeshes').forEach((boneMesh) => {
                                boneMesh.material.color.set(color);
                            });
                        });
                        hand.fingers.forEach((finger) => {
                            finger.data('boneMeshes').forEach((boneMesh) => {
                                boneMesh.material.color.set(color);
                            });
                        });
                    });
                }).catch((err) => {
                    console.log(err);
                });
            }
        })
        .on('handFound', (hand) => {
            hand.fingers.forEach((finger) => {
                let boneMeshes = [];
                let jointMeshes = [];
                finger.bones.forEach((bone) => {
                    let boneMesh = new THREE.Mesh(
                        new THREE.CylinderGeometry(3, 3, bone.length),
                        new THREE.MeshBasicMaterial({
                            color: 0xff0000,
                            wireframe: true
                        })
                    );
                    scene.add(boneMesh);
                    boneMeshes.push(boneMesh);
                });

                for (let i = 0; i < finger.bones.length + 1; i++) {
                    let jointMesh = new THREE.Mesh(
                        new THREE.SphereGeometry(7, 6, 4),
                        new THREE.MeshBasicMaterial({
                            color: 0xff0000,
                            wireframe: true
                        })
                    );
                    scene.add(jointMesh);
                    jointMeshes.push(jointMesh);
                }
                finger.data('boneMeshes', boneMeshes);
                finger.data('jointMeshes', jointMeshes);
            });
        })
        .on('handLost', (hand) => {
            hand.fingers.forEach((finger) => {
                let boneMeshes = finger.data('boneMeshes');
                let jointMeshes = finger.data('jointMeshes');
                boneMeshes.forEach((mesh) => {
                    scene.remove(mesh);
                });
                jointMeshes.forEach((mesh) => {
                    scene.remove(mesh);
                });
                finger.data({
                    boneMeshes: null
                });
            });
        });

    const updateHand = (hand) => {
        hand.fingers.forEach((finger) => {
            finger.data('boneMeshes').forEach((mesh, i) => {
                let bone = finger.bones[i];
                mesh.position.fromArray(bone.center());
                mesh.setRotationFromMatrix(new THREE.Matrix4().fromArray(bone.matrix()));
                mesh.quaternion.multiply(baseBoneRotation);
            });

            finger.data('jointMeshes').forEach((mesh, i) => {
                let bone = finger.bones[i];
                if (bone) {
                    mesh.position.fromArray(bone.prevJoint);
                } else {
                    bone = finger.bones[i - 1];
                    mesh.position.fromArray(bone.nextJoint);
                }
            });

        });
    };

    const initScene = () => {
        let width = $('#render_area').parent().innerWidth();
        let height = window.innerHeight - $('#render_area').offset().top - 20;
        renderer = new THREE.WebGLRenderer();
        renderer.setSize(width, height);
        $('#render_area')[0].appendChild(renderer.domElement);
        camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
        camera.position.y = 160;
        camera.position.z = 800;
        scene = new THREE.Scene();
        scene.add(new THREE.AxisHelper(400));
        scene.add(new THREE.GridHelper(400, 10));
        return scene;

    };

    const addLeapCube = (scene) => {
        let geometry, material, mesh;
        geometry = new THREE.CubeGeometry(80, 11.5, 30);
        material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            wireframe: true
        });
        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
    };

    const animate = () => {
        window.requestAnimationFrame(animate);
        renderer.render(scene, camera);
        leapController.frame(0).hands.forEach(updateHand);
    };
    initScene();
    addLeapCube(scene);
    leapController.connect();
    animate();




    const getJointsVectors = (finger) => {
        let jointsVectors = [];
        finger.bones.forEach((bone) => {
            let nextJoint = bone.nextJoint;
            let prevJoint = bone.prevJoint;
            jointsVectors.push(nextJoint);
        });
        return jointsVectors;
    };

    const getFingerVectors = (hand) => {
        let fingerVectors = [];
        hand.fingers.forEach((finger) => {
            fingerVectors.push(getJointsVectors(finger));
        });
        return fingerVectors;
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
};