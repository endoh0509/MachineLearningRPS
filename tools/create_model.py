from keras.datasets import mnist
from keras.models import Sequential
from keras.layers.core import Dense, Activation
from keras.utils import np_utils

import pandas as pd

h5_file_path = '../assets/model/rps_model.h5'
hdf5_file_path = '../assets/model/rps_model.hdf5'
json_file_path = '../assets/model/rps_model.json'
train_file = 'csv/train.csv'
test_file = 'csv/test.csv'

train = pd.read_csv(train_file)

col_list = train.columns.tolist()
col_list.remove('type')
X_train = train[col_list].as_matrix()
Y_train = train['type'].as_matrix()

print(X_train[0].shape)
print(X_train.shape)
# print(Y_train)

Y_train = np_utils.to_categorical(Y_train)

# print(Y_train)

# model = Sequential([
#     Dense(512, input_shape=(234,)),
#     Activation('sigmoid'),
#     Dense(10),
#     Activation('softmax')
# ])

# 234	ニューロンの数
# activation	活性化関数の指定
# input_shape	最初の層では入力の形を指定しなければいけない。それ以降の層では不要

# Dense(): 全結合
# Activation(): 活性化関数
# BatchNormalization(): バッチ正規化 (学習しやすくする)

# 128 -> 0.272727272727
# 192 -> 0.272727272727
# 256 -> 0.245454545455
# 512 -> 0.236363636364

model = Sequential()
model.add(Dense(128, input_dim=len(X_train[0])))     # 入力層 -> 隠れ層
model.add(Activation('sigmoid'))
# model.add(Activation('relu'))
model.add(Dense(5))       # 隠れ層 -> 出力層
model.add(Activation('softmax'))

# 損失関数、 最適化アルゴリズムなどを設定しモデルのコンパイルを行う
# model.compile(loss='categorical_crossentropy', optimizer='sgd', metrics=['accuracy'])
model.compile(optimizer='rmsprop',
              loss='categorical_crossentropy',
              metrics=['accuracy'])

# 学習処理の実行
hist = model.fit(X_train, Y_train, batch_size=220, verbose=1, epochs=20, validation_split=0.1)

test = pd.read_csv(test_file)
col_list = test.columns.tolist()
col_list.remove('type')
X_test = test[col_list].as_matrix()
Y_test = test['type'].as_matrix()
Y_test = np_utils.to_categorical(Y_test)
score = model.evaluate(X_test, Y_test, verbose=1)
print('test accuracy : ', score[1])

# model.save(h5_file_path)
# with open(json_file_path, 'w') as f:
#     f.write(model.to_json())
# h5_file_path = './server/model/rps_model_weights.h5'
# hdf5_file_path = './server/model/rps_model_weights.hdf5'
# json_file_path = './server/model/rps_model_weights.json'


# モデルの保存
model_json_str = model.to_json()
open(json_file_path, 'w').write(model_json_str)

model.save(hdf5_file_path)


# 重みの保存
# model.save_weights(hdf5_file_path)






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
