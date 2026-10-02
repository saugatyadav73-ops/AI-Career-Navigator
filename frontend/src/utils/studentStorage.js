export const getCurrentStudent = () => {
  try {
    const student = localStorage.getItem("student");

    if (!student) {
      return null;
    }

    return JSON.parse(student);
  } catch (error) {
    console.error("Student storage error:", error);
    return null;
  }
};

export const getStudentId = () => {
  const student = getCurrentStudent();

  return student?.id ? String(student.id) : null;
};

export const getStudentKey = (key) => {
  const studentId = getStudentId();

  if (!studentId) {
    return key;
  }

  return `student_${studentId}_${key}`;
};

export const saveStudentData = (key, data) => {
  try {
    const studentKey = getStudentKey(key);

    localStorage.setItem(
      studentKey,
      JSON.stringify(data)
    );

    return true;
  } catch (error) {
    console.error("Save student data error:", error);
    return false;
  }
};

export const getStudentData = (key, defaultValue = null) => {
  try {
    const studentKey = getStudentKey(key);
    const data = localStorage.getItem(studentKey);

    if (!data) {
      return defaultValue;
    }

    return JSON.parse(data);
  } catch (error) {
    console.error("Get student data error:", error);
    return defaultValue;
  }
};

export const removeStudentData = (key) => {
  try {
    const studentKey = getStudentKey(key);

    localStorage.removeItem(studentKey);

    return true;
  } catch (error) {
    console.error("Remove student data error:", error);
    return false;
  }
};