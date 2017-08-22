import java.util.Date;
import java.text.SimpleDateFormat;



boolean[] fingerListTo5bits(ArrayList<Finger> fngs) {
  boolean[] fngsBit = {false, false, false, false, false};
  for (Finger fng : fngs) {
    fngsBit[fng.getType()] = true;
  }
  return fngsBit;
}

// ***************************************
// *************** save CSV **************
// ***************************************

void init() {
  File imgDir = new File(dataPath("img"));
  ArrayList<String> imgList = new ArrayList<String>();
  for (File file : imgDir.listFiles()) {
    if (file.getPath().endsWith(".jpg")) {
      imgList.add(file.getName());
    }
  }
  types = new String[imgList.size()];
  imgs = new PImage[imgList.size()];
  int imgCount = 0;
  for (String name : imgList) {
    types[imgCount] = name.substring(0, name.lastIndexOf('.'));
    imgs[imgCount] = loadImage("img/" + name);
    imgCount++;
  }
  currentType = 0;

  header = new ArrayList<String>();
  header.add("type");
  for (String param : handParams) {
    header.add(param);
  }
  for (String param : armParams) {
    header.add(param);
  }
  for (String finger : fingerList) {
    for (String param : fingerParams) {
      header.add(finger + "_" + param);
    }
  }
  dataList = new ArrayList<ArrayList<String>>();
}

void addList(ArrayList<ArrayList<String>> _list) {
  for (Hand hand : leap.getHands ()) {
    ArrayList<String> row = new ArrayList<String>();
    addElem(row, currentType);

    ArrayList<Finger> fngs = hand.getOutstretchedFingers();
    ArrayList<Finger> fngsByAng = hand.getOutstretchedFingersByAngel();

    int     handId                           = hand.getId();
    PVector handPosition                     = hand.getPosition();
    PVector handStabilized                   = hand.getStabilizedPosition();
    PVector handDirection                    = hand.getDirection();
    PVector handDynamics                     = hand.getDynamics();
    float   handRoll                         = hand.getRoll();
    float   handPitch                        = hand.getPitch();
    float   handYaw                          = hand.getYaw();
    boolean handIsLeft                       = hand.isLeft();
    boolean handIsRight                      = hand.isRight();
    float   handGrab                         = hand.getGrabStrength();
    float   handPinch                        = hand.getPinchStrength();
    float   handTime                         = hand.getTimeVisible();
    PVector spherePosition                   = hand.getSpherePosition();
    float   sphereRadius                     = hand.getSphereRadius();
    int     outstretchedFingersNum           = fngs.size();
    int     outstretchedFingersByAngleNum    = fngsByAng.size();

    addElem(row, handId);
    addElem(row, handPosition);
    addElem(row, handStabilized);
    addElem(row, handDirection);
    addElem(row, handDynamics);
    addElem(row, handRoll);
    addElem(row, handPitch);
    addElem(row, handYaw);
    addElem(row, handIsLeft);
    addElem(row, handIsRight);
    addElem(row, handGrab);
    addElem(row, handPinch);
    addElem(row, handTime);
    addElem(row, spherePosition);
    addElem(row, sphereRadius);
    addElem(row, outstretchedFingersNum);
    addElem(row, outstretchedFingersByAngleNum);

    boolean[] fgBits = fingerListTo5bits(fngs);
    boolean[] fgBitsByAng = fingerListTo5bits(fngsByAng);
    addElem(row, fgBits);
    addElem(row, fgBitsByAng);


    if (hand.hasArm()) {
      Arm     arm              = hand.getArm();
      float   armWidth         = arm.getWidth();
      PVector armWristPos      = arm.getWristPosition();
      PVector armElbowPos      = arm.getElbowPosition();

      addElem(row, armWidth);
      addElem(row, armWristPos);
      addElem(row, armElbowPos);
    } else {
      addElem(row, "null");
      addElem(row, "null");
      addElem(row, "null");
    }

    Finger  fingerThumb        = hand.getThumb();
    Finger  fingerIndex        = hand.getIndexFinger();
    Finger  fingerMiddle       = hand.getMiddleFinger();
    Finger  fingerRing         = hand.getRingFinger();
    Finger  fingerPink         = hand.getPinkyFinger();

    for (Finger finger : hand.getFingers()) {
      int     fingerId         = finger.getId();
      PVector fingerPosition   = finger.getPosition();
      PVector fingerStabilized = finger.getStabilizedPosition();
      PVector fingerVelocity   = finger.getVelocity();
      PVector fingerDirection  = finger.getDirection();
      float   fingerTime       = finger.getTimeVisible();
      PVector rawPositionOfJointDip = finger.getRawPositionOfJointDip();
      PVector rawPositionOfJointMcp = finger.getRawPositionOfJointMcp();
      PVector rawPositionOfJointPip = finger.getRawPositionOfJointPip();
      PVector rawPositionOfJointTip = finger.getRawPositionOfJointTip();
      PVector positionOfJointDip = finger.getPositionOfJointDip();
      PVector positionOfJointMcp = finger.getPositionOfJointMcp();
      PVector positionOfJointPip = finger.getPositionOfJointPip();
      PVector positionOfJointTip = finger.getPositionOfJointTip();

      addElem(row, fingerId);
      addElem(row, fingerPosition);
      addElem(row, fingerStabilized);
      addElem(row, fingerVelocity);
      addElem(row, fingerDirection);
      addElem(row, fingerTime);
      addElem(row, rawPositionOfJointDip);
      addElem(row, rawPositionOfJointMcp);
      addElem(row, rawPositionOfJointPip);
      addElem(row, rawPositionOfJointTip);
      addElem(row, positionOfJointDip);
      addElem(row, positionOfJointMcp);
      addElem(row, positionOfJointPip);
      addElem(row, positionOfJointTip);
    }
    _list.add(row);
    println(row);
  }
}

void saveCSV(String _path) {
  if (dataList != null && dataList.size() != 0) {
    Table table = new Table();
    for (String column : header) {
      table.addColumn(column);
    }
    for (ArrayList<String> row : dataList) {
      TableRow newRow = table.addRow();
      int i = 0;
      for (String data : row) {
        newRow.setString(header.get(i), data);
        i++;
      }
    }
    saveTable(table, _path);
  }
}

String genNextFilePath() {
  Date now = new Date();
  SimpleDateFormat df = new SimpleDateFormat("yyMMddHHmmss");
  File dir = new File(dataPath("csv/" + df.format(now)));
  if (dir.exists()) {
    int fileCount = 0;
    for (File file : dir.listFiles()) {
      if (file.getPath().endsWith(".csv")) {
        fileCount++;
      }
    }
    return dataPath("csv/" + df.format(now)) + "/" + String.format("%06d", fileCount);
  } else {
    return dataPath("csv/" + df.format(now)) + "/000000";
  }
}

// ***************************************
// *********** Save Meta Data ************
// ***************************************

void saveMetaJSON(String _path) {
  JSONObject json = new JSONObject();

  // Types
  JSONArray typesObj = new JSONArray();
  for (int i = 0; i <  types.length; i++) {
    JSONObject typeObj = new JSONObject();
    typeObj.setInt("id", i);
    typeObj.setString("type", types[i]);
    typesObj.setJSONObject(i, typeObj);
  }
  json.setJSONArray("types", typesObj);

  // Hand Params
  JSONArray handParamsObj = new JSONArray();
  int i = 0;
  for (String param : handParams) {
    handParamsObj.setString(i, param);
    i++;
  }
  json.setJSONArray("hand_param", handParamsObj);
  // Arm Params
  JSONArray armParamsObj = new JSONArray();
  i = 0;
  for (String param : armParams) {
    armParamsObj.setString(i, param);
    i++;
  }
  json.setJSONArray("arm_param", armParamsObj);
  // Finger Params
  JSONArray fingerParamsObj = new JSONArray();
  i = 0;
  for (String param : fingerParams) {
    fingerParamsObj.setString(i, param);
    i++;
  }
  json.setJSONArray("finger_param", fingerParamsObj);
  // Finger List
  JSONArray fingerListsObj = new JSONArray();
  i = 0;
  for (String param : fingerList) {
    fingerListsObj.setString(i, param);
    i++;
  }
  json.setJSONArray("finger_list", fingerListsObj);

  saveJSONObject(json, _path);
}

// ***************************************
// ************** add Elem ***************
// ***************************************

void addElem(ArrayList<String> _list, PVector _vec) {
  _list.add(String.valueOf(_vec.x));
  _list.add(String.valueOf(_vec.y));
  _list.add(String.valueOf(_vec.z));
}

void addElem(ArrayList<String> _list, float _f) {
  _list.add(String.valueOf(_f));
}

void addElem(ArrayList<String> _list, int _i) {
  _list.add(String.valueOf(_i));
}

void addElem(ArrayList<String> _list, boolean _b) {
  _list.add(_b ? "1" : "0");
}

void addElem(ArrayList<String> _list, String _s) {
  _list.add(String.valueOf(_s));
}

void addElem(ArrayList<String> _list, boolean[] _bs) {
  for (Boolean b : _bs) {
    _list.add(b ? "1" : "0");
  }
}