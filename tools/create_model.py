from keras.models import Sequential
from keras.layers.core import Dense, Activation
from keras.utils import np_utils

import pandas as pd
import os


def main():
    script_dir = os.path.abspath(os.path.dirname(__file__))
    hdf5_file_path = script_dir + '/../assets/model/rps_model.hdf5'
    json_file_path = script_dir + '/../assets/model/rps_model.json'
    train_file = script_dir + '/csv/train.csv'
    test_file = script_dir + '/csv/test.csv'

    weights_filepath = '{}.hdf5'.format(os.path.splitext(hdf5_file_path)[0])

    train = pd.read_csv(train_file)

    col_list = train.columns.tolist()
    col_list.remove('type')
    X_train = train[col_list].as_matrix()
    Y_train = train['type'].as_matrix()

    print(X_train[0].shape)
    print(X_train.shape)
    Y_train = np_utils.to_categorical(Y_train)

    model = Sequential()
    model.add(Dense(128, input_dim=len(X_train[0])))
    model.add(Activation('sigmoid'))
    model.add(Dense(5))
    model.add(Activation('softmax'))

    model.compile(optimizer='rmsprop',
                  loss='categorical_crossentropy',
                  metrics=['accuracy'])

    hist = model.fit(X_train, Y_train, batch_size=220, verbose=1, epochs=20, validation_split=0.1)

    test = pd.read_csv(test_file)
    col_list = test.columns.tolist()
    col_list.remove('type')
    X_test = test[col_list].as_matrix()
    Y_test = test['type'].as_matrix()
    Y_test = np_utils.to_categorical(Y_test)
    score = model.evaluate(X_test, Y_test, verbose=1)
    print('test accuracy : ', score[1])

    # モデルの保存
    model_json_str = model.to_json()
    open(json_file_path, 'w').write(model_json_str)
    model.save(hdf5_file_path)




    # ***********************************
    # ネットワークの可視化
    from keras.utils import plot_model
    plot_model(model, to_file='model.png')


    # ***********************************
    # matplotlibによる学習状況の可視化
    import matplotlib.pyplot as plt

    loss = hist.history['loss']
    val_loss = hist.history['val_loss']

    # lossのグラフ
    plt.plot(range(20), loss, marker='.', label='loss')
    plt.plot(range(20), val_loss, marker='.', label='val_loss')
    plt.legend(loc='best', fontsize=10)
    plt.grid()
    plt.xlabel('epoch')
    plt.ylabel('loss')
    plt.show()

    acc = hist.history['acc']
    val_acc = hist.history['val_acc']

    # accuracyのグラフ
    plt.plot(range(20), acc, marker='.', label='acc')
    plt.plot(range(20), val_acc, marker='.', label='val_acc')
    plt.legend(loc='best', fontsize=10)
    plt.grid()
    plt.xlabel('epoch')
    plt.ylabel('acc')
    plt.show()

if __name__ == '__main__':
    main()
