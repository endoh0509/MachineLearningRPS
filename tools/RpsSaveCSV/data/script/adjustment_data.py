import glob
import os
import pandas as pd
import numpy as np
import re
import math
import sys
args = sys.argv

import data_params

type_map = {
    0: 4,
    1: 3,
    2: 0,
    3: 1,
    4: 2
}


def type_mapping(src):
    dst = type_map[src]
    return dst

def normalize_vector(vec):
    if isinstance(vec, dict):
        return vec
    elif isinstance(vec, list) or isinstance(vec, tuple):
        if len(vec) == 3:
            return {'x': vec[0], 'y': vec[1], 'z': vec[2]}
        elif len(vec) == 2:
            return {'x': vec[0], 'y': vec[1]}
        else:
            return None
    elif hasattr(vec, 'x') and hasattr(vec, 'y') and hasattr(vec, 'z'):
        return {'x': vec.x, 'y': vec.y, 'z': vec.z}
    elif hasattr(vec, 'x') and hasattr(vec, 'y'):
        return {'x': vec.x, 'y': vec.y}
    else:
        return None


def calc_distance(p1, p2):
    v1 = normalize_vector(p1)
    v2 = normalize_vector(p2)
    dx = v1['x'] - v2['x']
    dy = v1['y'] - v2['y']
    if 'z' in p1 and 'z' in p2:
        dz = v1['z'] - v2['z']
        return math.sqrt(dx * dx + dy * dy + dz * dz)
    else:
        return math.sqrt(dx * dx + dy * dy)


# poj: position_of_joint
def gen_poj_params():
    poj_params = []
    poj = 'position_of_joint'
    for finger in data_params.get_fingers():
        for joint in data_params.get_fingers_joints():
            for axis in data_params.get_axes():
                info_hash = {
                    'finger': finger,
                    'joint': joint,
                    'axis': axis,
                    'attr': '_'.join([finger, poj, joint, axis])
                }
                poj_params.append(info_hash)
    return poj_params


# fd: finger_direction
def gen_fd_params():
    fd_params = []
    fd = 'finger_direction'
    for finger in data_params.get_fingers():
        for axis in data_params.get_axes():
            info_hash = {
                'finger': finger,
                'axis': axis,
                'attr': '_'.join([finger, fd, axis])
            }
            fd_params.append(info_hash)
    return fd_params


def export_data(df, train_file_name='train.csv', test_file_name='test.csv', debug_print=True):
    trains = []
    tests = []
    for g in df.groupby('type'):
        split_array = np.array_split(g[1].values, 2)
        trains.append(split_array[0])
        tests.append(split_array[1])

    shape = np.array(trains).shape
    np_trains = np.array(trains).reshape(shape[1] * shape[0], shape[2], )
    shape = np.array(tests).shape
    np_tests = np.array(tests).reshape(shape[1] * shape[0], shape[2], )

    header = df.keys()
    trains_df = pd.DataFrame(np_trains, columns=header.values)
    # print(list(map(int, trains_df.type)))
    trains_df.type = list(map(int, trains_df.type))
    # print(trains_df)

    tests_df = pd.DataFrame(np_tests, columns=header.values)
    tests_df.type = list(map(int, tests_df.type))
    # print(tests_df)

    if debug_print:
        print(' ***** train data ***** ')
        print(trains_df['type'].value_counts())
        print(' ***** test data ***** ')
        print(trains_df['type'].value_counts())

    trains_df.to_csv(train_file_name, index=False)
    tests_df.to_csv(test_file_name, index=False)


def two_vec3_to_radians(v1, v2):
    nv1 = normalize_vector(list(v1))
    nv2 = normalize_vector(list(v2))
    return \
        nv1['x'] * nv2['x'] + nv1['y'] * nv2['y'] + nv1['z'] * nv2['z'] / \
        math.sqrt(nv1['x'] * nv1['x'] + nv1['y'] * nv1['y'] + nv1['z'] * nv1['z']) * \
        math.sqrt(nv2['x'] * nv2['x'] + nv2['y'] * nv2['y'] + nv2['z'] * nv2['z'])


def unit_vector(vector):
    """ Returns the unit vector of the vector.  """
    return vector / np.linalg.norm(vector)


def angle_between(v1, v2):
    v1 = normalize_vector(v1)
    v2 = normalize_vector(v2)
    if v1['x'] == 0 and v1['y'] == 0 and v1['z'] == 0:
        return 0.0
    if v2['x'] == 0 and v2['y'] == 0 and v2['z'] == 0:
        return 0.0
    dot = v1['x'] * v2['x'] + v1['y'] * v2['y'] + v1['z'] * v2['z'];
    v1mag = math.sqrt(v1['x'] * v1['x'] + v1['y'] * v1['y'] + v1['z'] * v1['z']);
    v2mag = math.sqrt(v2['x'] * v2['x'] + v2['y'] * v2['y'] + v2['z'] * v2['z']);
    amt = dot / (v1mag * v2mag)
    if amt <= -1:
        # return PConstants.PI
        return 0
    elif amt >= 1:
        return 0
    return math.acos(amt)


def main():

    debug_print = False
    filter_rows = []

    path = os.getcwd() + '/../csv/*/*csv'
    csv_files = glob.glob(path)

    df_list = []
    for csv_file in csv_files:
        df_list.append(pd.read_csv(csv_file))
    df = pd.concat(df_list)
    # df = df.sort_values('type')
    # shuffle
    df = df.iloc[np.random.permutation(len(df))]

    bef_key_num = len(df.keys().values)

    # ****** Drop keys ******
    drop_keys = []
    # print('(' + '|'.join(data_params.get_fingers()) + ')' +'.+_finger_id')
    reg_id = re.compile(
        '(' +
        '|'.join(list(map(lambda name: name + '_finger', data_params.get_fingers()))) +
        '|hand)' + '_id')
    id_keys = filter(reg_id.match, df.keys().values)
    drop_keys += id_keys
    reg_raw = re.compile('.+_raw_.+')
    raw_keys = filter(reg_raw.match, df.keys().values)
    drop_keys += raw_keys
    df = df.drop(drop_keys, axis=1)

    # print(df.keys().values)
    aft_key_num = len(df.keys().values)
    # print(str(bef_key_num) + '->' + str(aft_key_num))

    # ****** Calculate another parameters ******

    # finger distance
    poj_params = gen_poj_params()
    new_rows = []
    for joint in data_params.get_fingers_joints():
        fingers = data_params.get_fingers()
        for i in range(len(fingers) - 1):
            new_rows.append(joint + '_' + fingers[i] + '_' + fingers[i + 1] + '_distance')
    new_rows_data = []
    for key, row in df.iterrows():
        new_row_data = []
        for joint in data_params.get_fingers_joints():
            vecs = []
            for finger in data_params.get_fingers():
                vec = []
                for axis in data_params.get_axes():
                    # poj_paramsを各パラメータでフィルタリングしてvecを作る
                    attr = list(filter(lambda param:
                                       param['joint'] == joint and
                                       param['finger'] == finger and
                                       param['axis'] == axis, poj_params))[0]['attr']
                    vec.append(row[attr])
                vecs.append({'finger': finger, 'vec': vec})
            for i in range(len(vecs) - 1):
                dist = calc_distance(vecs[i]['vec'], vecs[i + 1]['vec'])
                new_row_data.append(dist)
        # print(key, row, new_row_data)
        new_rows_data.append(new_row_data)
    new_rows_data = list(np.array(new_rows_data).transpose())
    for i in range(len(new_rows)):
        df[new_rows[i]] = new_rows_data[i]

    filter_rows += new_rows

    # finger direction angle
    new_rows = []
    fingers = data_params.get_fingers()
    axes = data_params.get_axes()
    for i in range(1, len(fingers)):
        new_rows.append('finger_angle_thumb_' + fingers[i])

    new_rows_data = []
    for key, row in df.iterrows():
        new_row_data = []
        for finger_idx in range(1, len(fingers)):
            attr_x = '_'.join([fingers[0], 'finger_direction', axes[0]])
            attr_y = '_'.join([fingers[0], 'finger_direction', axes[1]])
            attr_z = '_'.join([fingers[0], 'finger_direction', axes[2]])
            thumb_direction = [row[attr_x], row[attr_y], row[attr_z]]
            finger_direction = []
            for axis in axes:
                attr = '_'.join([fingers[finger_idx], 'finger_direction', axis])
                finger_direction.append(row[attr])
            # print(math.degrees(two_vec3_to_radians(thumb_direction, finger_direction)))
            new_row_data.append(angle_between(thumb_direction, finger_direction))
            # new_row_data.append(math.degrees(two_vec3_to_radians(thumb_direction, finger_direction)))
        new_rows_data.append(new_row_data)
    new_rows_data = np.array(new_rows_data).transpose()
    for i in range(len(new_rows)):
        df[new_rows[i]] = new_rows_data[i]
    # filter_rows += new_rows


    # mapping type
    df['type'] = list(map(lambda type: type_mapping(type), df['type']))

    df = df.filter(items=['type'] + filter_rows)

    if debug_print:
        print('*** count rps type ***')
        print(df['type'].value_counts())

    if len(args) == 2:
        path = args[1]
    else:
        path = None

    if path is not None and os.path.isdir(path):
        export_data(df,
                    train_file_name=os.path.join(path, 'train.csv'),
                    test_file_name=os.path.join(path, 'test.csv'),
                    debug_print=debug_print)
    else:
        export_data(df,
                    train_file_name='../../../csv/train.csv',
                    test_file_name='../../../csv/test.csv',
                    debug_print=debug_print)

if __name__ == '__main__':
    main()
