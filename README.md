# 📲 Proximity-Based Attendance System Using Bluetooth Low Energy (BLE)

A mobile application that uses **Bluetooth Low Energy (BLE)** and **Facial Recognition** to enable secure, contactless, and real-time attendance marking. Designed with students and teachers in mind, this app ensures integrity in classroom attendance by eliminating the possibilities of proxy and misuse.

---

## 🚀 Features

- **👨‍🏫 Dual User Roles**  
  Teachers can create and manage classes, while students can join classes using a unique class code and mark attendance.

- **📍 BLE-Based Proximity Detection**  
  Uses BLE scanning and RSSI (signal strength) to ensure students are physically present in the classroom before marking attendance.

- **🔒 Face Recognition Authentication**  
  Uses AWS Rekognition to verify student identity during login, preventing proxy attendance through phone or credentials misuse.

- **🧾 Verified Registration**  
  Only teachers can register students. Each student's face and MAC ID are recorded and stored for future verification.

- **🕒 Real-Time Attendance**  
  Teachers detect nearby students via Bluetooth, and attendance is marked only if both BLE and MAC ID match.

- **🗃 Firebase Integration**  
  Uses Firebase for real-time database syncing and secure authentication.

- **📱 Cross-Platform App**  
  Developed using React Native for compatibility with both Android and iOS.

---

## 🧠 Tech Stack

| Technology      | Purpose                       |
| --------------- | ----------------------------- |
| React Native    | Frontend Mobile Development   |
| Firebase        | Authentication & Realtime DB  |
| AWS Rekognition | Face Comparison and Matching  |
| BLE Module      | Device Proximity Verification |

---

## 🏗️ System Architecture

The system consists of:

- A mobile app for Students and Teachers
- Firebase backend services (Authentication, Database)
- AWS for facial recognition
- BLE scanning to verify physical proximity
- MAC ID mapping for device-level validation

---

## 📈 Future Scope

- Integrate **Geolocation APIs** to supplement BLE for nearby but out-of-range students
- Add **Random Roll Call Verification** to reduce proxy attempts
- Build a **custom ML model** for faster, offline facial recognition
- Use **SQL/PostgreSQL** for optimized data handling and faster queries
- Add **notification system** for anomalies like duplicate logins or suspicious behavior
- Explore **NFC-based scanning** for even faster proximity validation
- Implement **analytics dashboard** for teachers and admins

---

## 👨‍💻 Team

- **Palash Chitnavis** (2022-IMT-080)
- **Mahesh Suryawanshi** (2022-IMT-068)
- **Pranav Jarande** (2022-IMT-087)
- **Riya Shewale** (2022-IMT-101)

---

## 📷 Screenshots

<p align="center">
  <img src="docs/screenshots/home.png" width="250"/>
  <img src="docs/screenshots/login.png" width="250"/>
  <img src="docs/screenshots/scan.png" width="250"/>
</p>

---

## 🙌 Contributions

Contributions, issues, and feature requests are welcome! Feel free to open a PR or raise an issue.

---

## 🌐 Connect

If you liked this project, give it a ⭐️ and feel free to connect with the developers.
