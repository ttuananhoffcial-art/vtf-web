import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Table, Button, Space, Typography, Layout, Input, message, Modal, 
  Form, Checkbox, Row, Col, Card, Dropdown, Popconfirm, Select, 
  Menu, List, Tag, Badge, Tabs, Divider, Statistic 
} from 'antd';
import { 
  SearchOutlined, EditOutlined, DeleteOutlined, SettingOutlined, 
  HomeOutlined, NotificationOutlined, CheckSquareOutlined, 
  CreditCardOutlined, StarOutlined, TrophyOutlined, FireOutlined, 
  IdcardOutlined, SendOutlined, CalendarOutlined, ClockCircleOutlined, 
  ArrowLeftOutlined, FileExcelOutlined, DownloadOutlined, 
  CloudUploadOutlined, FilePdfOutlined, DatabaseOutlined, 
  DollarOutlined, DownOutlined, ReloadOutlined, PlusOutlined, 
  ExportOutlined, ImportOutlined, ToolOutlined, BarChartOutlined, LineChartOutlined
} from '@ant-design/icons';
import axios from 'axios';
import * as XLSX from 'xlsx';
import 'antd/dist/reset.css';

const { Content, Header, Sider } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

const SHEETDB_URL = "https://script.google.com/macros/s/AKfycbwKZmMrzLUpkGADJfK_NvRkMy0MB6QX0jNxs7_aglA4brF9GCaLkG1inzeXcsoo4QqQEQ/exec";
const SHEETDB_THICAP_URL = "https://script.google.com/macros/s/AKfycbzwz-sgL-D5EHwn4qOwB1ITwYFe4jxidGDWFv2Fa2B7JYMOXsO8DKkDY68n9wXCwZKK/exec"; 

const DANH_SACH_CAP_DANG = [
  "Cấp 10", "Cấp 9", "Cấp 8", "Cấp 7", "Cấp 6", "Cấp 5", "Cấp 4", "Cấp 3", "Cấp 2", "Cấp 1", 
  "1 Đẳng", "2 Đẳng", "3 Đẳng", "4 Đẳng", "5 Đẳng", "6 Đẳng", "7 Đẳng", "8 Đẳng", "9 Đẳng"
];

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr); 
    if (isNaN(d.getTime())) return dateStr;
    const day = `0${d.getDate()}`.slice(-2);
    const month = `0${d.getMonth() + 1}`.slice(-2);
    return `${day}/${month}/${d.getFullYear()}`;
  } catch (e) { return dateStr; }
};

const getLevelScore = (capdang) => {
  if (!capdang) return 999;
  const str = String(capdang).toLowerCase().trim(); 
  const match = str.match(/\d+/);
  if (!match) return 999;
  const num = parseInt(match[0], 10);
  return str.includes("cấp") ? 100 - num : 100 + num;
};

const getBirthYear = (dob) => {
  if (!dob) return 9999; 
  const str = String(dob).trim(); 
  const match = str.match(/\d{4}/);
  return match ? parseInt(match[0], 10) : 9999;
};

const sortStudents = (a, b) => {
  const scoreA = getLevelScore(a.capdang); 
  const scoreB = getLevelScore(b.capdang);
  if (scoreA !== scoreB) return scoreA - scoreB;
  const gtA = String(a.gioitinh || "").toLowerCase(); 
  const gtB = String(b.gioitinh || "").toLowerCase();
  if (gtA < gtB) return -1; 
  if (gtA > gtB) return 1;
  return getBirthYear(a.ngaysinh) - getBirthYear(b.ngaysinh);
};

const getNextDanLevel = (currentLevel) => {
    if(!currentLevel) return "1 Đẳng";
    const lower = String(currentLevel).toLowerCase();
    if(lower.includes("cấp 1") && !lower.includes("10")) return "1 Đẳng";
    if(lower.includes("đẳng")) {
        const match = lower.match(/\d+/);
        if(match) {
            const num = parseInt(match[0], 10);
            return num < 9 ? `${num + 1} Đẳng` : "9 Đẳng";
        }
    }
    return "1 Đẳng"; 
};

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader(); 
  reader.onload = () => resolve(reader.result); 
  reader.onerror = error => reject(error); 
  reader.readAsDataURL(file);
});

const CustomBarChart = ({ data, color }) => {
  if (!data || data.length === 0) return <div style={{padding: 20, textAlign:'center'}}><Text type="secondary">Chưa có dữ liệu</Text></div>;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ padding: '20px 0' }}>
      {data.map((item, idx) => (
        <div key={idx} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
             <Text strong>{item.label}</Text>
             <Text strong style={{color: color}}>{item.value.toLocaleString()} đ</Text>
          </div>
          <div style={{ width: '100%', backgroundColor: '#f0f0f0', borderRadius: 4, height: 20, overflow: 'hidden' }}>
             <div style={{ width: `${(item.value / maxVal) * 100}%`, backgroundColor: color, height: '100%', borderRadius: 4, transition: 'width 0.5s ease-in-out' }}></div>
          </div>
        </div>
      ))}
    </div>
  )
};

const CustomLineChart = ({ data, color }) => {
  if (!data || data.length === 0) return <div style={{padding: 20, textAlign:'center'}}><Text type="secondary">Chưa có dữ liệu thống kê</Text></div>;
  
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const height = 300;
  const width = Math.max(800, data.length * 120); 
  const padding = 50;
  
  const getX = (i) => data.length === 1 ? width / 2 : padding + (i * ((width - 2 * padding) / (data.length - 1)));
  const getY = (val) => height - padding - ((val / maxVal) * (height - 2 * padding));

  const points = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');

  return (
     <div style={{ width: '100%', overflowX: 'auto', background: '#fff', padding: '10px 0' }}>
       <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', minWidth: `${width}px` }}>
         <line x1={padding} y1={padding} x2={width-padding} y2={padding} stroke="#e8e8e8" strokeDasharray="5,5" />
         <line x1={padding} y1={height/2} x2={width-padding} y2={height/2} stroke="#e8e8e8" strokeDasharray="5,5" />
         <line x1={padding} y1={height-padding} x2={width-padding} y2={height-padding} stroke="#d9d9d9" />
         
         <text x={padding - 10} y={padding + 5} textAnchor="end" fontSize="12" fill="#888">{maxVal.toLocaleString()}</text>
         <text x={padding - 10} y={height - padding + 5} textAnchor="end" fontSize="12" fill="#888">0</text>
         
         {data.length > 1 && (
           <>
             <polygon points={`${getX(0)},${height-padding} ${points} ${getX(data.length-1)},${height-padding}`} fill={color} opacity="0.1" />
             <polyline points={points} fill="none" stroke={color} strokeWidth="3" />
           </>
         )}

         {data.map((d, i) => {
             const x = getX(i);
             const y = getY(d.value);
             return (
                <g key={i}>
                   <circle cx={x} cy={y} r="5" fill={color} stroke="#fff" strokeWidth="2" />
                   <text x={x} y={height - padding + 20} textAnchor="middle" fontSize="12" fill="#555">{d.label}</text>
                   <text x={x} y={y - 12} textAnchor="middle" fontSize="12" fill={color} fontWeight="bold">{d.value.toLocaleString()}</text>
                </g>
             )
         })}
       </svg>
     </div>
  )
};

const App = () => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchTracuu, setSearchTracuu] = useState('');
  const [searchFeeStudent, setSearchFeeStudent] = useState(''); 
  const [selectedRowKeys, setSelectedRowKeys] = useState([]); 
  const [activeMenu, setActiveMenu] = useState('dashboard');
  
  const [isUserEditOpen, setIsUserEditOpen] = useState(false);
  const [isMemberEditOpen, setIsMemberEditOpen] = useState(false); 
  const [editingRecord, setEditingRecord] = useState(null);
  const [editingMember, setEditingMember] = useState(null); 
  const [tableParams, setTableParams] = useState({ pagination: { current: 1, pageSize: 10 } });

  const [form] = Form.useForm(); 
  const [memberForm] = Form.useForm(); 
  const [notiForm] = Form.useForm();
  const [classForm] = Form.useForm(); 
  const [studentForm] = Form.useForm(); 
  const [examForm] = Form.useForm();
  const [registerExamForm] = Form.useForm(); 
  const [classStudentEditForm] = Form.useForm();
  const [feeEditForm] = Form.useForm(); 
  const [examStudentForm] = Form.useForm();
  const [histFeeForm] = Form.useForm(); 
  const [danFeeConfigForm] = Form.useForm();
  const [registerDanMainForm] = Form.useForm();
  
  const fileInputRef = useRef(null); 
  const studentExcelRef = useRef(null); 
  const pdfInputRef = useRef(null);
  const excelResultInputRef = useRef(null);

  const LOGO_PATH = "/logo.png.jpg";

  const [notifications, setNotifications] = useState(() => JSON.parse(localStorage.getItem('vtf_notifications') || '[]'));
  const [hasNewNoti, setHasNewNoti] = useState(false); 
  const [classes, setClasses] = useState(() => JSON.parse(localStorage.getItem('vtf_classes') || '[]'));
  const [classStudents, setClassStudents] = useState(() => JSON.parse(localStorage.getItem('vtf_class_students') || '{}'));
  
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isClassEditOpen, setIsClassEditOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isClassStudentEditOpen, setIsClassStudentEditOpen] = useState(false);
  const [editingClassStudent, setEditingClassStudent] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedStudentKeys, setSelectedStudentKeys] = useState([]);

  const [exams, setExams] = useState(() => JSON.parse(localStorage.getItem('vtf_exams') || '[]'));
  const [examCandidates, setExamCandidates] = useState(() => JSON.parse(localStorage.getItem('vtf_exam_candidates') || '{}'));
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [isRegisterExamOpen, setIsRegisterExamOpen] = useState(false);
  const [selectedCandidateKeys, setSelectedCandidateKeys] = useState([]);
  const [isPdfWarningOpen, setIsPdfWarningOpen] = useState(false);
  const [missingCands, setMissingCands] = useState([]);
  const [pendingUpdates, setPendingUpdates] = useState([]);
  const [pendingPdfFile, setPendingPdfFile] = useState(null);
  const [savedPDFs, setSavedPDFs] = useState(() => JSON.parse(localStorage.getItem('vtf_saved_pdfs') || '[]'));

  const [isRegisterDanMainOpen, setIsRegisterDanMainOpen] = useState(false);
  const defaultDanFees = {"1 Đẳng": 200000, "2 Đẳng": 300000, "3 Đẳng": 400000, "4 Đẳng": 500000, "5 Đẳng": 600000, "6 Đẳng": 700000, "7 Đẳng": 800000, "8 Đẳng": 900000, "9 Đẳng": 1000000};
  const [danFeesConfig, setDanFeesConfig] = useState(() => JSON.parse(localStorage.getItem('vtf_dan_fees')) || defaultDanFees);
  const [isDanFeeConfigOpen, setIsDanFeeConfigOpen] = useState(false);

  const [hocphiData, setHocphiData] = useState(() => JSON.parse(localStorage.getItem('vtf_hocphi_data') || '{}'));
  const [selectedFeeClass, setSelectedFeeClass] = useState(null);
  const [historicalFees, setHistoricalFees] = useState(() => JSON.parse(localStorage.getItem('vtf_historical_fees') || '[]'));
  const [selectedFeeExam, setSelectedFeeExam] = useState(null);
  const [isEditFeeModalOpen, setIsEditFeeModalOpen] = useState(false);
  const [isAddExamStudentOpen, setIsAddExamStudentOpen] = useState(false);
  const [isEditHistFeeOpen, setIsEditHistFeeOpen] = useState(false);
  const [editingHistFee, setEditingHistFee] = useState(null);
  
  const [reportQuarter, setReportQuarter] = useState("");

  const [userList, setUserList] = useState(() => JSON.parse(localStorage.getItem('vtf_users') || '[{"username":"admin","password":"1","role":"ADMIN_GOC","hoten":"Quản Trị Viên","clb":"BQT","canEdit":true,"canImport":true,"canExport":true}]'));
  const isSuperAdmin = user?.username === 'admin';
  const isAdmin = user?.username === 'admin' || user?.role === 'ADMIN_PHU';

  const getTargetClubInfo = () => {
    const targetMaclb = selectedClass?.maclb || user?.clb;
    const refData = dataSource.find(d => d.maclb === targetMaclb && d.tenclb);
    return { maclb: targetMaclb, tenclb: refData ? refData.tenclb : "" };
  };

  const fetchData = async (currUser) => {
    if (!currUser) return;
    setLoading(true);
    try {
      const res = await axios.get(`${SHEETDB_URL}?timestamp=${new Date().getTime()}`);
      setDataSource(Array.isArray(res.data) ? res.data : []);
    } catch (e) { message.error("Lỗi dữ liệu hệ thống!"); } finally { setLoading(false); }
  };

  useEffect(() => {
    const syncData = () => {
      const savedNoti = localStorage.getItem('vtf_notifications'); if (savedNoti) { setNotifications(JSON.parse(savedNoti)); if (user && user.username !== 'admin') { setHasNewNoti(JSON.parse(savedNoti).length > parseInt(localStorage.getItem(`read_count_${user.username}`) || "0")); } }
      const savedCls = localStorage.getItem('vtf_classes'); if (savedCls) setClasses(JSON.parse(savedCls));
      const savedStud = localStorage.getItem('vtf_class_students'); if (savedStud) setClassStudents(JSON.parse(savedStud));
      const savedExams = localStorage.getItem('vtf_exams'); if (savedExams) setExams(JSON.parse(savedExams));
      const savedCands = localStorage.getItem('vtf_exam_candidates'); if (savedCands) setExamCandidates(JSON.parse(savedCands));
      const savedHp = localStorage.getItem('vtf_hocphi_data'); if (savedHp) setHocphiData(JSON.parse(savedHp));
      const savedHist = localStorage.getItem('vtf_historical_fees'); if (savedHist) setHistoricalFees(JSON.parse(savedHist));
      const savedDanFees = localStorage.getItem('vtf_dan_fees'); if (savedDanFees) setDanFeesConfig(JSON.parse(savedDanFees));
    };
    const interval = setInterval(syncData, 1500); 
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const checkAutomations = () => {
      const today = new Date();
      const currentMonthKey = `${today.getFullYear()}-${today.getMonth() + 1}`;

      if (today.getDate() >= 30) {
        const lastReset = localStorage.getItem('vtf_hp_last_reset');
        if (lastReset !== currentMonthKey) {
          let updatedHpData = { ...hocphiData };
          Object.keys(updatedHpData).forEach(classId => {
            Object.keys(updatedHpData[classId]).forEach(studentKey => {
              const currentStatus = updatedHpData[classId][studentKey].status;
              let currentDebt = updatedHpData[classId][studentKey].debtMonths || 0;
              if (currentStatus === 'Chưa đóng' || currentStatus === 'Cho nợ') currentDebt += 1; 
              updatedHpData[classId][studentKey] = { status: 'Chưa đóng', debtMonths: currentDebt };
            });
          });
          setHocphiData(updatedHpData); localStorage.setItem('vtf_hocphi_data', JSON.stringify(updatedHpData)); localStorage.setItem('vtf_hp_last_reset', currentMonthKey);
        }
      }

      if (today.getDate() >= 20) {
        const lastNotified = localStorage.getItem('vtf_hp_last_notified');
        if (lastNotified !== currentMonthKey) {
          let newNotis = [];
          Object.keys(hocphiData).forEach(classId => {
            const cls = classes.find(c => c.id === Number(classId));
            if (!cls) return;
            Object.keys(hocphiData[classId]).forEach(studentKey => {
              const status = hocphiData[classId][studentKey].status;
              if (status === 'Chưa đóng') {
                const studentList = classStudents[classId] || [];
                const stu = studentList.find(s => s.key === Number(studentKey) || s.key === String(studentKey));
                if (stu) {
                  newNotis.push({ id: Date.now() + Math.random(), title: `Cảnh báo trễ học phí: ${stu.hoten}`, content: `Học viên: ${stu.hoten}\nLớp: ${cls.name}\nTrạng thái: Trễ học phí tháng này. Vui lòng nhắc nhở thanh toán!`, time: new Date().toLocaleString() });
                }
              }
            });
          });
          if (newNotis.length > 0) {
             const updatedNotis = [...newNotis, ...notifications];
             setNotifications(updatedNotis); localStorage.setItem('vtf_notifications', JSON.stringify(updatedNotis)); setHasNewNoti(true);
          }
          localStorage.setItem('vtf_hp_last_notified', currentMonthKey);
        }
      }
    };
    checkAutomations();
  }, [hocphiData, classes, classStudents, notifications]);

  useEffect(() => {
    if (activeMenu === 'thongbao' && user && user.username !== 'admin') {
      setHasNewNoti(false); localStorage.setItem(`read_count_${user.username}`, notifications.length.toString());
    }
  }, [activeMenu, notifications.length, user]);

  const handleStudentFormChange = (changedValues) => {
    if (changedValues.mahv) {
      const info = dataSource.find(d => String(d.mahv) === String(changedValues.mahv));
      if (info) studentForm.setFieldsValue({ hoten: info.hoten, ngaysinh: info.ngaysinh || "", capdang: info.capdang });
    }
  };

  const calculateExamLevel = (levelStr) => {
    if (!levelStr) return "Chưa xác định";
    const numMatch = String(levelStr).match(/\d+/);
    return numMatch ? (parseInt(numMatch[0], 10) > 1 ? `Cấp ${parseInt(numMatch[0], 10) - 1}` : `1 Đẳng`) : "Chưa xác định";
  };

  const handleAutoCreateExam = () => {
    const d = new Date(); const q = Math.ceil((d.getMonth() + 1) / 3);
    const clbCode = user?.clb && user.clb !== 'BQT' ? user.clb : '';
    examForm.setFieldsValue({ code: `Q${q}-${d.getFullYear()}${clbCode ? `-${clbCode}` : ''}`, name: `Kỳ thi Thăng cấp/đẳng Quý ${q} Năm ${d.getFullYear()}`, examCategory: 'Cấp', lephi: 0, maclb: clbCode });
    setEditingRecord(null); setIsExamModalOpen(true);
  };

  const handleDeleteClass = (classId) => {
    const newClasses = classes.filter(c => c.id !== classId);
    setClasses(newClasses); localStorage.setItem('vtf_classes', JSON.stringify(newClasses));
    const newClassStudents = {...classStudents}; delete newClassStudents[classId];
    setClassStudents(newClassStudents); localStorage.setItem('vtf_class_students', JSON.stringify(newClassStudents));
    const newHocphi = {...hocphiData}; delete newHocphi[classId];
    setHocphiData(newHocphi); localStorage.setItem('vtf_hocphi_data', JSON.stringify(newHocphi));
    if (selectedClass && selectedClass.id === classId) setSelectedClass(null);
    message.success("Đã xóa lớp học và danh sách học viên trong lớp thành công!");
  };

  const displayClassStudents = useMemo(() => {
    if (!selectedClass || !classStudents[selectedClass.id]) return [];
    return classStudents[selectedClass.id].map(student => {
      let updatedStudent = { ...student, trangthai: student.trangthai || "Hoạt động" };
      if (student.mahv && student.mahv !== "Chưa có") {
        const globalInfo = dataSource.find(d => String(d.mahv) === String(student.mahv));
        if (globalInfo) { updatedStudent = { ...updatedStudent, hoten: globalInfo.hoten || student.hoten, ngaysinh: globalInfo.ngaysinh || student.ngaysinh, capdang: globalInfo.capdang || student.capdang, gioitinh: globalInfo.gioitinh || student.gioitinh }; }
      }
      return updatedStudent;
    }).sort(sortStudents);
  }, [selectedClass, classStudents, dataSource]);

  const availableExamsForClass = useMemo(() => {
    if (!selectedClass) return [];
    const classMaclb = String(selectedClass.maclb || '').trim().toLowerCase();
    return exams.filter(ex => String(ex.maclb || '').trim().toLowerCase() === classMaclb && ex.examCategory !== 'Đẳng');
  }, [exams, selectedClass]);

  const handleRegisterExamSubmit = (values) => {
    const examCode = values.examCode;
    const studentsToAdd = displayClassStudents.filter(s => selectedStudentKeys.includes(s.key)).map(s => {
        const info = dataSource.find(d => String(d.mahv) === String(s.mahv));
        return { key: Math.random() + Date.now(), capthi: calculateExamLevel(s.capdang), mahv: s.mahv, hoten: s.hoten, ngaysinh: s.ngaysinh, gioitinh: info ? (info.gioitinh || "Chưa có") : (s.gioitinh || "Chưa có"), makythi: examCode, ketqua: "", capdang: s.capdang };
    });
    const currentCands = examCandidates[examCode] || [];
    const newCands = studentsToAdd.filter(newStu => !currentCands.some(existStu => existStu.mahv !== "Chưa có" && String(existStu.mahv) === String(newStu.mahv)));
    const updatedCands = [...currentCands, ...newCands].sort(sortStudents);
    setExamCandidates({ ...examCandidates, [examCode]: updatedCands });
    localStorage.setItem('vtf_exam_candidates', JSON.stringify({ ...examCandidates, [examCode]: updatedCands }));
    message.success(`Đã thêm ${newCands.length} võ sinh vào kỳ thi!`);
    setIsRegisterExamOpen(false); setSelectedStudentKeys([]); 
  };

  const handleRegisterDanMainSubmit = (values) => {
    const examCode = values.examCode;
    const studentsToAdd = dataSource.filter(d => selectedRowKeys.includes(d.mahv)).map(s => {
        return { key: Math.random() + Date.now(), capthi: getNextDanLevel(s.capdang), mahv: s.mahv, hoten: s.hoten, ngaysinh: s.ngaysinh, gioitinh: s.gioitinh || "Chưa có", makythi: examCode, ketqua: "", capdang: s.capdang };
    });
    const currentCands = examCandidates[examCode] || [];
    const newCands = studentsToAdd.filter(newStu => !currentCands.some(existStu => String(existStu.mahv) === String(newStu.mahv)));
    const updatedCands = [...currentCands, ...newCands].sort(sortStudents);
    setExamCandidates({ ...examCandidates, [examCode]: updatedCands });
    localStorage.setItem('vtf_exam_candidates', JSON.stringify({ ...examCandidates, [examCode]: updatedCands }));
    message.success(`Đã thêm ${newCands.length} võ sinh vào kỳ thi Thăng Đẳng!`);
    setIsRegisterDanMainOpen(false); setSelectedRowKeys([]); setActiveMenu('thidang');
  };

  const loadPdfJs = () => new Promise((resolve) => {
    if (window.pdfjsLib) return resolve(window.pdfjsLib);
    const script = document.createElement('script'); script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
    script.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js"; resolve(window.pdfjsLib); };
    document.head.appendChild(script);
  });

  const handlePDFUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const hide = message.loading("Đang phân tích PDF...", 0);
    try {
      const pdfjsLib = await loadPdfJs(); const arrayBuffer = await file.arrayBuffer(); const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i); const textContent = await page.getTextContent(); fullText += textContent.items.map(s => s.str).join(" ") + " ";
      }
      fullText = fullText.replace(/\n/g, ' ');
      const matches = [...fullText.matchAll(/v\s*\d{2}\s*-?\s*\d\s*\d\s*\d\s*\d\s*\d\s*\d/gi)];
      const pdfParsedResults = [];
      const normalizeStr = (s) => s ? s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase() : "";

      matches.forEach((match, i) => {
        const id = match[0].replace(/[-\s]/g, '').toUpperCase(); 
        const textBefore = fullText.substring(i > 0 ? matches[i-1].index : Math.max(0, match.index - 200), match.index);
        const levelMatch = textBefore.match(/(cấp\s*\d+|\d+\s*đẳng)[_\-]\d+/i);
        const searchArea = fullText.substring(match.index, i < matches.length - 1 ? matches[i+1].index : fullText.length);
        const compactSearch = normalizeStr(searchArea).replace(/\s+/g, '');
        let ketqua = "";
        if (compactSearch.includes("quenquyen")) ketqua = "Không Đạt ( Quên Quyền)";
        else if (compactSearch.includes("khongdat")) ketqua = "Không Đạt";
        else if (compactSearch.includes("dat")) ketqua = "Đạt";
        else if (compactSearch.includes("vang")) ketqua = "Vắng";
        if (ketqua) { pdfParsedResults.push({ mahv: id, ketqua, capthi: levelMatch ? levelMatch[1].replace(/cấp/i, 'Cấp').replace(/đẳng/i, 'Đẳng') : null }); }
      });

      const currentCands = examCandidates[selectedExam.code] || [];
      const validUpdates = []; const missingList = [];
      pdfParsedResults.forEach(pdfRow => {
        if (currentCands.find(c => String(c.mahv).replace(/[-\s]/g, '').toUpperCase() === pdfRow.mahv)) { validUpdates.push(pdfRow); } else { missingList.push(pdfRow); }
      });

      if (missingList.length > 0) { 
        setMissingCands(missingList); setPendingUpdates(validUpdates); setPendingPdfFile(file); setIsPdfWarningOpen(true); 
      } else { await executePdfUpdates(validUpdates, file); }
      hide();
    } catch (err) { hide(); message.error("Lỗi đọc file PDF!"); } finally { e.target.value = null; }
  };

  const handleExcelResultUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const hide = message.loading("Đang cập nhật kết quả từ Excel...", 0);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const wb = XLSX.read(ev.target.result, { type: 'binary' });
        const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { raw: false });
        
        let updatedCount = 0;
        const currentCands = [...(examCandidates[selectedExam.code] || [])];
        
        const newCands = currentCands.map(c => {
          const match = json.find(row => {
            const excelMahv = row['Mã HV'] || row['mahv'] || row['MAHV'];
            return excelMahv && String(excelMahv).replace(/[-\s]/g, '').toUpperCase() === String(c.mahv).replace(/[-\s]/g, '').toUpperCase();
          });

          if (match) {
            const kq = match['Kết Quả'] || match['Ket Qua'] || match['ketqua'];
            if (kq) {
              c.ketqua = String(kq).trim();
              updatedCount++;
            }
          }
          return c;
        });

        setExamCandidates({ ...examCandidates, [selectedExam.code]: newCands.sort(sortStudents) });
        localStorage.setItem('vtf_exam_candidates', JSON.stringify({ ...examCandidates, [selectedExam.code]: newCands }));

        hide();
        message.success(`Hoàn tất! Đã cập nhật kết quả cho ${updatedCount} võ sinh.`);
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      hide();
      message.error("Lỗi đọc file Excel!");
    } finally {
      e.target.value = null;
    }
  };

  const executePdfUpdates = async (updatesArray, pdfFileToSave = null) => {
    const hide = message.loading("Đang cập nhật kết quả...", 0);
    const currentCands = [...(examCandidates[selectedExam.code] || [])]; let updatedCount = 0;
    const newCands = currentCands.map(c => {
      const match = updatesArray.find(u => u.mahv === String(c.mahv).replace(/[-\s]/g, '').toUpperCase());
      if (match) { c.ketqua = match.ketqua; if (match.capthi) c.capthi = match.capthi; updatedCount++; }
      return c;
    });

    setExamCandidates({ ...examCandidates, [selectedExam.code]: newCands.sort(sortStudents) });
    localStorage.setItem('vtf_exam_candidates', JSON.stringify({ ...examCandidates, [selectedExam.code]: newCands }));

    if (pdfFileToSave && !savedPDFs.some(p => p.name === pdfFileToSave.name && p.examCode === selectedExam.code)) {
      try {
        const base64Data = await fileToDataUrl(pdfFileToSave);
        const updatedPdfs = [{ id: Date.now(), name: pdfFileToSave.name, examCode: selectedExam.code, date: new Date().toLocaleString(), data: base64Data }, ...savedPDFs];
        setSavedPDFs(updatedPdfs); localStorage.setItem('vtf_saved_pdfs', JSON.stringify(updatedPdfs));
      } catch (e) {}
    }

    try {
      const dataToSyncSheet = newCands.filter(c => c.ketqua && c.ketqua.trim() !== "").map(c => ({"Cấp Thi": c.capthi, "Mã HV": c.mahv, "Họ Tên": c.hoten, "Ngày sinh": c.ngaysinh, "Giới Tính": c.gioitinh, "Mã kỳ Thi": c.makythi, "Kết Quả": c.ketqua}));
      if (dataToSyncSheet.length > 0) { await axios.post(SHEETDB_THICAP_URL, JSON.stringify({ data: dataToSyncSheet }), { headers: { 'Content-Type': 'text/plain;charset=utf-8' } }); }
      fetchData(user); hide(); message.success(`Hoàn tất! Đã chấm ${updatedCount} võ sinh.`);
    } catch (error) { hide(); message.error("Lỗi đồng bộ Cloud do đường truyền."); }
  };

  const handleEditClassStudentSubmit = async (values) => {
    const clubInfo = getTargetClubInfo(); 
    const payload = { ...values, maclb: clubInfo.maclb, tenclb: clubInfo.tenclb };
    const updatedClassStudents = (classStudents[selectedClass.id] || []).map(s => s.key === editingClassStudent.key ? { ...s, ...payload } : s);
    const newMap = { ...classStudents, [selectedClass.id]: updatedClassStudents };
    setClassStudents(newMap); localStorage.setItem('vtf_class_students', JSON.stringify(newMap));

    if (values.mahv && values.mahv !== "Chưa có") {
      try {
        if (dataSource.find(d => String(d.mahv) === String(values.mahv))) {
          await axios.patch(`${SHEETDB_URL}/mahv/${encodeURIComponent(values.mahv)}`, { data: payload });
        } else {
          await axios.post(SHEETDB_URL, JSON.stringify({ data: [payload] }), { headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
        }
        fetchData(user); message.success("Đã đồng bộ thông tin võ sinh!");
      } catch (error) { message.error("Lỗi đồng bộ lên hệ thống!"); }
    }
    setIsClassStudentEditOpen(false);
  };

  const updateExamCandidate = (key, field, value) => {
    const code = selectedExam?.code || selectedFeeExam?.code; 
    if(!code) return;
    const updated = (examCandidates[code] || []).map(c => c.key === key ? { ...c, [field]: value } : c);
    setExamCandidates({ ...examCandidates, [code]: updated.sort(sortStudents) }); 
    localStorage.setItem('vtf_exam_candidates', JSON.stringify({ ...examCandidates, [code]: updated }));
  };

  const getExamExportData = () => {
    return (examCandidates[selectedExam.code] || []).filter(c => selectedCandidateKeys.length === 0 || selectedCandidateKeys.includes(c.key)).map(c => ({"Cấp Thi": c.capthi, "Mã HV": c.mahv, "Họ Tên": c.hoten, "Ngày sinh": c.ngaysinh, "Giới Tính": c.gioitinh, "Mã kỳ Thi": c.makythi, "Kết Quả": c.ketqua}));
  };

  const exportSelectedExam = () => {
    const data = getExamExportData(); 
    if(data.length === 0) return message.warning("Không có dữ liệu!");
    const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); 
    XLSX.utils.book_append_sheet(wb, ws, "Thi"); XLSX.writeFile(wb, `DanhSachThi_${selectedExam.code}.xlsx`);
  };

  const syncExamToGoogleSheet = async () => {
    // 1. LƯU KẾT QUẢ THI VÀ DOANH THU
    const resultData = getExamExportData().filter(c => c["Kết Quả"] && c["Kết Quả"].trim() !== "");
    if(resultData.length === 0) return message.warning("Chưa có kết quả để lưu!");
    
    setLoading(true);
    try {
      await axios.post(SHEETDB_THICAP_URL, JSON.stringify({ data: resultData }), { headers: { 'Content-Type': 'text/plain;charset=utf-8' } });

      const revenueByClub = {};
      const isDanExam = selectedExam.examCategory === 'Đẳng';
      let totalCandsByClub = {};

      resultData.forEach(student => {
          const info = dataSource.find(d => String(d.mahv) === String(student["Mã HV"]));
          const maclb = info?.maclb || selectedExam.maclb || 'Chung';
          if (!revenueByClub[maclb]) { revenueByClub[maclb] = 0; totalCandsByClub[maclb] = 0; }
          
          let feeToCharge = 0;
          if (isDanExam) {
              feeToCharge = parseInt(danFeesConfig[student["Cấp Thi"]]) || 0;
          } else {
              feeToCharge = parseFloat(selectedExam.lephi) || 0;
          }
          revenueByClub[maclb] += feeToCharge;
          totalCandsByClub[maclb] += 1;
      });

      const monthYear = `${new Date().getMonth() + 1}/${new Date().getFullYear()}`;
      const revenueData = Object.keys(revenueByClub).map(maclb => ({ 
        maclb, monthYear, 
        examType: isDanExam ? "Thi Đẳng" : "Thi Cấp", 
        examCode: selectedExam.code, 
        candsCount: totalCandsByClub[maclb],
        revenue: revenueByClub[maclb] 
      }));

      if (revenueData.length > 0) {
        await axios.post(SHEETDB_THICAP_URL, JSON.stringify({ data: revenueData }), { headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
      }
      
      const newHistoryRecords = revenueData.map(r => ({ id: Date.now() + Math.random(), ...r }));
      const updatedHistory = [...historicalFees.filter(h => h.examCode !== selectedExam.code), ...newHistoryRecords];
      
      setHistoricalFees(updatedHistory); 
      localStorage.setItem('vtf_historical_fees', JSON.stringify(updatedHistory));

      // 2. TỰ ĐỘNG NÂNG CẤP ĐẲNG CHO VÕ SINH ĐẠT
      const currentCands = examCandidates[selectedExam.code] || [];
      const passedCandidates = currentCands.filter(c => c.ketqua === 'Đạt' && c.mahv && c.mahv !== 'Chưa có');

      if (passedCandidates.length > 0) {
        message.loading({ content: `Đang tự động nâng cấp đẳng cho ${passedCandidates.length} võ sinh "Đạt"...`, key: 'updateLevel' });

        const updatedDataSource = [...dataSource];
        let hasChanges = false;

        passedCandidates.forEach(passed => {
          const studentIndex = updatedDataSource.findIndex(d => String(d.mahv) === String(passed.mahv));
          if (studentIndex !== -1) {
             updatedDataSource[studentIndex] = { ...updatedDataSource[studentIndex], capdang: passed.capthi };
             hasChanges = true;
          }
        });

        if (hasChanges) {
          setDataSource(updatedDataSource);
        }

        const MAX_CONCURRENT = 5; 
        for (let i = 0; i < passedCandidates.length; i += MAX_CONCURRENT) {
           const chunk = passedCandidates.slice(i, i + MAX_CONCURRENT);
           await Promise.all(chunk.map(async (c) => {
              try { 
                await axios.patch(`${SHEETDB_URL}/mahv/${encodeURIComponent(c.mahv)}`, { data: { capdang: c.capthi } }); 
              } 
              catch(err) { 
                await new Promise(resolve => setTimeout(resolve, 1000)); 
                try { await axios.patch(`${SHEETDB_URL}/mahv/${encodeURIComponent(c.mahv)}`, { data: { capdang: c.capthi } }); } catch(e2){} 
              }
           }));
           await new Promise(resolve => setTimeout(resolve, 300)); 
        }
        
        fetchData(user);
        message.success({ content: `Đã lưu Kết quả, Doanh thu và Nâng cấp đẳng thành công!`, key: 'updateLevel', duration: 4 });
      } else {
        message.success("Đã lưu Kết quả và Doanh thu lên Sheet (Không có võ sinh nào Đạt để nâng cấp)!");
      }

    } catch(e) { 
      message.error("Lỗi đồng bộ!"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleAdminChotSo = async () => {
    const summary = getAdminSummary();
    const monthYear = `${new Date().getMonth() + 1}/${new Date().getFullYear()}`;
    const dataToSync = summary.map(s => ({ 
      type: "CHOT_SO_THANG", maclb: s.maclb, monthYear: monthYear, 
      tongHocVien: s.activeStudents, thiCapCount: s.thiCapCount, thiDangCount: s.thiDangCount,
      thuHocPhi: s.thuHocPhi, tongNo: s.noHocPhi, thuThiCap: s.thuThiCap, tongDoanhThu: s.thuHocPhi + s.thuThiCap 
    }));
    
    setLoading(true);
    try { 
      await axios.post(SHEETDB_THICAP_URL, JSON.stringify({ data: dataToSync }), { headers: { 'Content-Type': 'text/plain;charset=utf-8' } }); 

      const newHist = summary.map(s => ({
         id: Date.now() + Math.random(),
         maclb: s.maclb, monthYear: monthYear, examType: 'Học Phí',
         examCode: 'HP_' + monthYear, candsCount: s.activeStudents, revenue: s.thuHocPhi
      }));
      const updatedHistory = [...historicalFees.filter(h => h.examCode !== 'HP_' + monthYear), ...newHist];
      setHistoricalFees(updatedHistory); localStorage.setItem('vtf_historical_fees', JSON.stringify(updatedHistory));

      message.success("Đã chốt sổ Tổng doanh thu và đẩy lên Google Sheet thành công!"); 
    } catch(e) { message.error("Lỗi khi đẩy dữ liệu chốt sổ!"); } finally { setLoading(false); }
  };

  const handleLogin = (values) => {
    const found = userList.find(u => u.username === values.username && u.password === values.password);
    if (found) { setUser(found); setIsLoggedIn(true); fetchData(found); } 
    else message.error("Sai tài khoản!");
  };

  const filteredClasses = useMemo(() => {
    if (!user) return []; 
    return user.username === 'admin' || user.role?.includes('ADMIN') ? classes : classes.filter(cls => String(cls.maclb) === String(user.clb));
  }, [classes, user]);
  
  const filteredExams = useMemo(() => {
    if (!user) return []; 
    return user.username === 'admin' || user.role?.includes('ADMIN') ? exams : exams.filter(ex => !ex.maclb || String(ex.maclb) === String(user.clb));
  }, [exams, user]);

  const displayData = useMemo(() => {
     let data = dataSource;
     if (searchText) {
        data = data.filter(i => (i.hoten || "").toLowerCase().includes(searchText.toLowerCase()) || (i.mahv || "").toLowerCase().includes(searchText.toLowerCase()));
     }
     return data;
  }, [dataSource, searchText]);
  
  const getFilterProps = (dataIndex) => ({ filters: [...new Set(dataSource.map(item => item[dataIndex]))].filter(i => i).map(val => ({ text: val, value: val })), onFilter: (value, record) => String(record[dataIndex]) === String(value), filterSearch: true });
  const handleTableChange = (pagination) => setTableParams({ pagination });

  const traCuuHoiVienData = useMemo(() => {
      if (!searchTracuu) return [];
      const allCands = []; Object.values(examCandidates).forEach(examList => allCands.push(...examList));
      return allCands.filter(item => (item.mahv || "").toLowerCase().includes(searchTracuu.toLowerCase()) || (item.makythi || "").toLowerCase().includes(searchTracuu.toLowerCase()));
  }, [searchTracuu, examCandidates]);

  const updateStudentFeeStatus = (classId, studentKey, newStatus) => {
    const classFeeData = hocphiData[classId] || {}; const studentFee = classFeeData[studentKey] || { debtMonths: 0 };
    if (studentFee.debtMonths >= 2 && newStatus === 'Cho nợ') return message.error("Không được phép nợ quá 2 tháng!");
    const newHpData = { ...hocphiData, [classId]: { ...classFeeData, [studentKey]: { ...studentFee, status: newStatus } } };
    setHocphiData(newHpData); localStorage.setItem('vtf_hocphi_data', JSON.stringify(newHpData));
  };

  const getAdminSummary = () => {
    const summary = {};
    filteredClasses.forEach(cls => {
      const maclb = cls.maclb || 'Chung'; 
      if (!summary[maclb]) summary[maclb] = { thuHocPhi: 0, noHocPhi: 0, thuThiCap: 0, activeStudents: 0, thiCapCount: 0, thiDangCount: 0 };
      const feePerStudent = parseFloat(cls.hocphi) || 0; 
      const cStudents = classStudents[cls.id] || []; const cFeeData = hocphiData[cls.id] || {};
      
      cStudents.forEach(s => {
        if (s.trangthai === 'Hoạt động') {
          summary[maclb].activeStudents++;
          if ((cFeeData[s.key]?.status || 'Chưa đóng') === 'Đã đóng') summary[maclb].thuHocPhi += feePerStudent; 
          else summary[maclb].noHocPhi += feePerStudent;
        }
      });
    });

    filteredExams.forEach(ex => {
       const isDan = ex.examCategory === 'Đẳng';
       const cands = examCandidates[ex.code] || [];
       
       cands.forEach(c => {
           const info = dataSource.find(d => String(d.mahv) === String(c.mahv));
           const maclb = info?.maclb || ex.maclb || 'Chung';
           if (!summary[maclb]) summary[maclb] = { thuHocPhi: 0, noHocPhi: 0, thuThiCap: 0, activeStudents: 0, thiCapCount: 0, thiDangCount: 0 };
           
           if (isDan) {
               summary[maclb].thiDangCount++;
               summary[maclb].thuThiCap += (parseInt(danFeesConfig[c.capthi]) || 0);
           } else {
               summary[maclb].thiCapCount++;
               summary[maclb].thuThiCap += (parseFloat(ex.lephi) || 0);
           }
       });
    });

    return Object.entries(summary).map(([maclb, data]) => ({ maclb, ...data }));
  };

  const reportQuartersList = useMemo(() => {
     const periods = new Set(historicalFees.map(h => h.monthYear).filter(Boolean));
     return Array.from(periods).sort((a,b) => {
         const [mA, yA] = a.split('/').map(Number);
         const [mB, yB] = b.split('/').map(Number);
         if (yA !== yB) return yB - yA;
         return mB - mA;
     });
  }, [historicalFees]);

  useEffect(() => {
     if (reportQuartersList.length > 0 && !reportQuarter) setReportQuarter(reportQuartersList[0]);
  }, [reportQuartersList, reportQuarter]);

  const reportDataHocPhi = useMemo(() => {
     const data = {};
     historicalFees.forEach(h => {
        if (h.examType === 'Học Phí' && h.monthYear === reportQuarter) {
           if (!data[h.maclb]) data[h.maclb] = 0;
           data[h.maclb] += h.revenue;
        }
     });
     return Object.entries(data).map(([label, value]) => ({ label, value })).sort((a,b) => b.value - a.value);
  }, [historicalFees, reportQuarter]);

  const reportTrendThiCap = useMemo(() => {
      const dataMap = {};
      historicalFees.forEach(h => {
          if (h.examType === 'Thi Cấp') {
              if (!dataMap[h.monthYear]) dataMap[h.monthYear] = 0;
              dataMap[h.monthYear] += h.revenue;
          }
      });
      const sortedDates = Object.keys(dataMap).sort((a, b) => {
         const [mA, yA] = a.split('/').map(Number); const [mB, yB] = b.split('/').map(Number);
         if (yA !== yB) return yA - yB; return mA - mB;
      });
      return sortedDates.map(date => ({ label: date, value: dataMap[date] }));
  }, [historicalFees]);

  const reportDanStats = useMemo(() => {
     let total = 0, passed = 0, failed = 0;
     exams.filter(e => e.examCategory === 'Đẳng').forEach(ex => {
        const cands = examCandidates[ex.code] || [];
        total += cands.length;
        cands.forEach(c => {
           if (c.ketqua === 'Đạt') passed++;
           else if (c.ketqua && c.ketqua.includes('Không Đạt')) failed++;
        });
     });
     return { total, passed, failed };
  }, [exams, examCandidates]);


  const renderExamSection = (categoryTitle, categoryFilter) => {
    const isDan = categoryFilter === 'Đẳng';
    return (
      <div style={{ background: '#fff', padding: '20px', borderRadius: 8, minHeight:'80vh' }}>
         {!selectedExam ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <Title level={4}>QUẢN LÝ KỲ THI {categoryTitle}</Title>
              <Space>
                {isDan && isAdmin && <Button icon={<ToolOutlined />} onClick={() => setIsDanFeeConfigOpen(true)}>Cài đặt Phí Thi Đẳng</Button>}
                {isAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={handleAutoCreateExam}>Tạo mã kỳ thi</Button>}
              </Space>
            </div>
            <Table dataSource={filteredExams.filter(e => isDan ? e.examCategory === 'Đẳng' : e.examCategory !== 'Đẳng')} rowKey="id" bordered
              columns={[
                { title: 'Mã kỳ thi', dataIndex: 'code', render: t => <Tag color={isDan ? 'purple' : 'volcano'}>{t}</Tag> },
                { title: 'Mã CLB', dataIndex: 'maclb', render: t => <Tag color="blue">{t}</Tag> },
                { title: 'Tên kỳ thi', dataIndex: 'name', render: (t,r) => <a onClick={() => setSelectedExam(r)} style={{fontWeight:'bold'}}>{t}</a> },
                { title: 'Số lượng đăng ký', render: (t, r) => <b style={{color:'#1d39c4'}}>{(examCandidates[r.code] || []).length} võ sinh</b> },
                ...(isAdmin ? [{ title: 'Thao tác', width: 100, render: (t, r) => (
                  <Space>
                    <EditOutlined style={{color:'#1890ff', cursor:'pointer'}} onClick={() => { setEditingRecord(r); examForm.setFieldsValue(r); setIsExamModalOpen(true); }} />
                    <Popconfirm title="Xóa?" onConfirm={() => { const up = exams.filter(e => e.id !== r.id); setExams(up); localStorage.setItem('vtf_exams', JSON.stringify(up)); }}><DeleteOutlined style={{color:'red', cursor:'pointer'}}/></Popconfirm>
                  </Space>
                )}] : [])
              ]}
            />
          </>
         ) : (
          <>
            <Button icon={<ArrowLeftOutlined />} onClick={() => {setSelectedExam(null); setSelectedCandidateKeys([]);}} style={{ marginBottom: 15 }}>Quay lại</Button>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' }}>
              <Title level={4} style={{margin:0}}>Danh sách: {selectedExam.name} (<Tag color={isDan ? 'purple' : 'volcano'}>{selectedExam.code}</Tag>) - CLB: {selectedExam.maclb}</Title>
              <Space>
                {selectedCandidateKeys.length > 0 && (
                  <Popconfirm title={`Xóa ${selectedCandidateKeys.length} võ sinh khỏi danh sách thi?`} onConfirm={() => {
                    const up = (examCandidates[selectedExam.code] || []).filter(c => !selectedCandidateKeys.includes(c.key));
                    setExamCandidates({...examCandidates, [selectedExam.code]: up}); localStorage.setItem('vtf_exam_candidates', JSON.stringify({...examCandidates, [selectedExam.code]: up}));
                    setSelectedCandidateKeys([]);
                  }}>
                    <Button danger icon={<DeleteOutlined />}>Xóa chọn</Button>
                  </Popconfirm>
                )}
                <input type="file" accept="application/pdf" style={{ display: 'none' }} ref={pdfInputRef} onChange={handlePDFUpload} />
                <input type="file" accept=".xlsx, .xls" style={{ display: 'none' }} ref={excelResultInputRef} onChange={handleExcelResultUpload} />
                {isAdmin && <Button icon={<FilePdfOutlined />} type="dashed" danger onClick={() => pdfInputRef.current.click()}>Upload PDF KQ</Button>}
                {isAdmin && <Button icon={<FileExcelOutlined />} type="dashed" style={{ color: '#52c41a', borderColor: '#52c41a' }} onClick={() => excelResultInputRef.current.click()}>Upload Excel KQ</Button>}
                <Button icon={<DownloadOutlined />} onClick={exportSelectedExam}>Tải Excel</Button>
                {isAdmin && <Button type="primary" icon={<CloudUploadOutlined />} style={{background: '#52c41a'}} onClick={syncExamToGoogleSheet} loading={loading}>Lưu lên Sheet</Button>}
              </Space>
            </div>
            <Table 
              rowKey="key"
              rowSelection={{ selectedRowKeys: selectedCandidateKeys, onChange: setSelectedCandidateKeys, selections: [Table.SELECTION_ALL, Table.SELECTION_NONE] }}
              dataSource={examCandidates[selectedExam.code] || []} 
              bordered size="small" scroll={{ x: 1000 }}
              columns={[
                { title: 'Cấp Thi', dataIndex: 'capthi', width: 110, render: (t, r) => <Input defaultValue={t} onBlur={e => updateExamCandidate(r.key, 'capthi', e.target.value)} bordered={false} style={{borderBottom: '1px dashed #ccc', borderRadius: 0}} /> },
                { title: 'Mã HV', dataIndex: 'mahv', width: 120, render: t => <b>{t}</b> },
                { title: 'Họ Tên', dataIndex: 'hoten' },
                { title: 'Ngày sinh', dataIndex: 'ngaysinh', width: 110, render: t => formatDate(t) },
                { title: 'Giới Tính', dataIndex: 'gioitinh', width: 90 },
                { title: 'Mã kỳ Thi', dataIndex: 'makythi', width: 110, render: t => <Tag>{t}</Tag> },
                { 
                  title: 'Kết Quả', dataIndex: 'ketqua', width: 170, 
                  render: (t, r) => (
                    <Select 
                      value={t || undefined} placeholder="Chọn KQ" onChange={val => updateExamCandidate(r.key, 'ketqua', val)} 
                      bordered={false} style={{ width: '100%', fontWeight: t==='Đạt'?'bold':'normal', color: t==='Đạt'?'green': (t && t.includes('Không')) ? 'red' : t==='Vắng'?'orange':'black' }}
                      options={[{ value: 'Đạt', label: 'Đạt' }, { value: 'Không Đạt', label: 'Không Đạt' }, { value: 'Không Đạt ( Quên Quyền)', label: 'Không Đạt (Quên Quyền)' }, { value: 'Vắng', label: 'Vắng' }]}
                    />
                  ) 
                }
              ]}
            />
          </>
         )}
      </div>
    );
  };

  if (!isLoggedIn) return (
    <div style={{ background: '#f0f2f5', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Card style={{ width: 380, borderRadius: 12, textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <img src={LOGO_PATH} width={150} alt="logo" style={{ marginBottom: 20 }} />
        <Form onFinish={handleLogin} layout="vertical">
          <Form.Item name="username" rules={[{ required: true }]}><Input placeholder="Tài khoản" size="large" /></Form.Item>
          <Form.Item name="password" rules={[{ required: true }]}><Input.Password placeholder="Mật khẩu" size="large" /></Form.Item>
          <Button type="primary" block size="large" htmlType="submit" style={{background:'#1d39c4'}}>ĐĂNG NHẬP</Button>
        </Form>
      </Card>
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={230} theme="dark">
        <div style={{ padding: '30px 10px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom:10 }}>
          <img src={LOGO_PATH} width={130} alt="logo" style={{ marginBottom: 15 }} />
          <Title level={5} style={{ color: '#fff', margin: 0, textTransform:'uppercase', fontSize:'14px' }}>Hệ Thống Quản Lý</Title>
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[activeMenu]} onClick={(e) => {setActiveMenu(e.key); setSelectedClass(null); setSelectedExam(null); setSelectedFeeClass(null); setSelectedFeeExam(null);}} items={[
          { key: 'dashboard', icon: <HomeOutlined />, label: 'Bảng Điều Khiển' },
          { key: 'thongbao', icon: <Badge dot={hasNewNoti} offset={[5, 0]}><NotificationOutlined /></Badge>, label: 'Thông báo' },
          { key: 'diemdanh', icon: <CheckSquareOutlined />, label: 'Điểm danh' },
          { key: 'thicap', icon: <StarOutlined />, label: 'Thi cấp' },
          { key: 'thidang', icon: <TrophyOutlined />, label: 'Thi Đẳng' }, 
          { key: 'hocphi', icon: <DollarOutlined />, label: 'Học phí' },
          { key: 'baocao', icon: <BarChartOutlined />, label: 'Báo cáo' },
          { key: 'tracuu', icon: <DatabaseOutlined />, label: 'Tra cứu' },
          ...(isSuperAdmin ? [{ key: 'caidat', icon: <SettingOutlined />, label: 'Cài đặt' }] : []),
        ]} />
      </Sider>

      <Layout>
        <Header style={{ background: '#fff', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid #eee' }}>
          <Space>
            <b>{user.hoten} ({user.clb})</b>
            <Button onClick={() => window.location.reload()} danger>Đăng xuất</Button>
          </Space>
        </Header>

        <Content style={{ padding: '20px' }}>
          {activeMenu === 'dashboard' ? (
            <div style={{ background: '#fff', padding: '20px', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
                <Title level={4} style={{margin:0}}>Danh Sách Học Viên Tổng</Title>
                <Space>
                  {selectedRowKeys.length > 0 && (
                    <Button type="primary" style={{backgroundColor: '#722ed1', borderColor: '#722ed1'}} icon={<TrophyOutlined />} onClick={() => {
                        const availableDanExams = filteredExams.filter(e => e.examCategory === 'Đẳng');
                        if(availableDanExams.length === 0) return message.warning("Chưa có kỳ thi Đẳng nào. Hãy tạo mã trước!");
                        registerDanMainForm.resetFields();
                        setIsRegisterDanMainOpen(true);
                    }}>
                      Thi Thăng Đẳng ({selectedRowKeys.length})
                    </Button>
                  )}
                  <Input prefix={<SearchOutlined />} placeholder="Tìm kiếm..." onChange={e => setSearchText(e.target.value)} allowClear style={{width:200}} />
                  <Button icon={<ReloadOutlined />} onClick={() => fetchData(user)} loading={loading} />
                  
                  <input type="file" accept=".xlsx, .xls" style={{ display: 'none' }} ref={fileInputRef} onChange={async (e) => {
                    const file = e.target.files[0]; 
                    if(!file) return;
                    const reader = new FileReader();
                    reader.onload = async (ev) => {
                      message.loading({ content: 'Đang xử lý dữ liệu và đẩy lên hệ thống...', key: 'importData', duration: 0 });
                      try {
                        const wb = XLSX.read(ev.target.result, { type: 'binary' });
                        const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { raw: false }); 
                        const existingDataMap = new Map();
                        dataSource.forEach(d => existingDataMap.set(String(d.mahv).trim(), d));

                        const toInsert = []; const toUpdate = []; const cleanStr = (s) => String(s || '').trim().toLowerCase();
                        json.forEach(row => {
                          if (row.mahv) {
                            const mahvStr = String(row.mahv).trim();
                            if (existingDataMap.has(mahvStr)) {
                                const existingRow = existingDataMap.get(mahvStr); let isChanged = false;
                                for (let key of ['hoten', 'maclb', 'tenclb', 'capdang', 'ngaysinh', 'gioitinh']) { 
                                  if (row[key] !== undefined && cleanStr(row[key]) !== cleanStr(existingRow[key])) { isChanged = true; break; } 
                                }
                                if (isChanged) toUpdate.push(row);
                            } else toInsert.push(row);
                          }
                        });

                        if (toInsert.length === 0 && toUpdate.length === 0) return message.info({ content: 'Dữ liệu y hệt nhau, không có gì cần cập nhật!', key: 'importData', duration: 3 });

                        const MAX_CONCURRENT = 5; 
                        if (toInsert.length > 0) {
                          for(let i = 0; i < toInsert.length; i += 50) {
                              message.loading({ content: `Đang thêm mới ${Math.min(i + 50, toInsert.length)}/${toInsert.length} học viên...`, key: 'importData', duration: 0 });
                              try { await axios.post(SHEETDB_URL, JSON.stringify({ data: toInsert.slice(i, i+50) }), { headers: { 'Content-Type': 'text/plain;charset=utf-8' } }); await new Promise(resolve => setTimeout(resolve, 500)); } 
                              catch(err) { await new Promise(resolve => setTimeout(resolve, 2000)); await axios.post(SHEETDB_URL, JSON.stringify({ data: toInsert.slice(i, i+50) }), { headers: { 'Content-Type': 'text/plain;charset=utf-8' } }); }
                          }
                        }

                        if (toUpdate.length > 0) {
                           for (let i = 0; i < toUpdate.length; i += MAX_CONCURRENT) {
                             const chunk = toUpdate.slice(i, i + MAX_CONCURRENT);
                             message.loading({ content: `Đang cập nhật thay đổi: ${Math.min(i + MAX_CONCURRENT, toUpdate.length)}/${toUpdate.length} học viên...`, key: 'importData', duration: 0 });
                             await Promise.all(chunk.map(async (r) => {
                                try { await axios.patch(`${SHEETDB_URL}/mahv/${encodeURIComponent(r.mahv)}`, { data: r }); } 
                                catch(err) { await new Promise(resolve => setTimeout(resolve, 1000)); try { await axios.patch(`${SHEETDB_URL}/mahv/${encodeURIComponent(r.mahv)}`, { data: r }); } catch(e2){} }
                             }));
                             await new Promise(resolve => setTimeout(resolve, 300)); 
                           }
                        }
                        message.success({ content: `Thành công! Đã thêm mới ${toInsert.length}, cập nhật ${toUpdate.length} học viên.`, key: 'importData', duration: 4 }); fetchData(user);
                      } catch(err) { message.error({ content: 'Lỗi Import! Máy chủ Google Sheet bị quá tải.', key: 'importData', duration: 4 }); } finally { e.target.value = null; }
                    }; reader.readAsBinaryString(file);
                  }} />

                  <Dropdown menu={{ items: [
                    { key: '1', label: `Tải Excel`, icon: <ExportOutlined />, onClick: () => { const exportData = dataSource.filter(item => selectedRowKeys.includes(item.mahv)); const ws = XLSX.utils.json_to_sheet(exportData.length ? exportData : dataSource); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Data"); XLSX.writeFile(wb, "Export.xlsx"); }, disabled: !user.canExport && !isAdmin }, 
                    { key: '2', label: 'Import Excel', icon: <ImportOutlined />, onClick: () => fileInputRef.current.click(), disabled: !user.canImport && !isAdmin }
                  ] }}>
                    <Button type="primary" icon={<DownOutlined />} style={{background:'#1d39c4'}}>Hành động</Button>
                  </Dropdown>
                </Space>
              </div>
              <Table 
                rowKey="mahv" 
                rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys, preserveSelectedRowKeys: true, selections: [Table.SELECTION_ALL, Table.SELECTION_NONE] }} 
                dataSource={displayData} 
                loading={loading} 
                bordered size="small" scroll={{ x: 1200 }}
                pagination={{ ...tableParams.pagination, pageSizeOptions: ['10', '20', '50', '100', '500', '1000'], showSizeChanger: true }}
                onChange={handleTableChange}
                columns={[
                  { title: 'STT', key: 'stt', width: 80, render: (t, r, i) => (tableParams.pagination.current - 1) * tableParams.pagination.pageSize + i + 1 }, 
                  ...((isAdmin || user.canEdit) ? [{ title: 'Sửa', width: 70, render: (t, r) => <EditOutlined style={{color: '#1890ff', cursor:'pointer'}} onClick={() => { setEditingMember(r); memberForm.setFieldsValue(r); setIsMemberEditOpen(true); }} /> }] : []), 
                  { title: 'Mã HV', dataIndex: 'mahv', width: 120, render: t => <b style={{color:'#1d39c4'}}>{t}</b> }, 
                  { title: 'Họ tên', dataIndex: 'hoten' }, 
                  { title: 'Giới tính', dataIndex: 'gioitinh', width: 90, ...getFilterProps('gioitinh') }, 
                  { title: 'Ngày sinh', dataIndex: 'ngaysinh', width: 110, ...getFilterProps('ngaysinh'), render: t => formatDate(t) }, 
                  { title: 'Mã CLB', dataIndex: 'maclb', width: 110, ...getFilterProps('maclb') }, 
                  { title: 'Tên CLB', dataIndex: 'tenclb', ...getFilterProps('tenclb') }, 
                  { title: 'Đẳng cấp', dataIndex: 'capdang', width: 120, ...getFilterProps('capdang') }
                ]}
              />
            </div>
          ) : activeMenu === 'diemdanh' ? (
            <div style={{ background: '#fff', padding: '20px', borderRadius: 8, minHeight:'80vh' }}>
              {!selectedClass ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                    <Title level={4}>LỚP TẬP ĐANG HOẠT ĐỘNG</Title>
                    {isAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={() => { classForm.resetFields(); setIsAddClassOpen(true); }}>Thêm Lớp</Button>}
                  </div>
                  <Row gutter={[16, 20]}>
                    {filteredClasses.map(cls => (
                      <Col span={6} key={cls.id}>
                        <Card 
                          hoverable style={{ borderRadius: 12, borderLeft: '6px solid #1d39c4' }} 
                          title={<b>{cls.name}</b>} 
                          onClick={() => setSelectedClass(cls)}
                          extra={isAdmin && (
                            <Space>
                              <EditOutlined onClick={(e) => { e.stopPropagation(); setEditingRecord(cls); classForm.setFieldsValue(cls); setIsClassEditOpen(true); }} />
                              <Popconfirm 
                                title="Xóa lớp sẽ xóa luôn danh sách học sinh. Bạn chắc chắn?" 
                                onConfirm={(e)=>{ e.stopPropagation(); handleDeleteClass(cls.id); }}
                              >
                                <DeleteOutlined style={{color:'red'}} onClick={e=>e.stopPropagation()} />
                              </Popconfirm>
                            </Space>
                          )}
                        >
                          <Space direction="vertical" size={2}>
                            <Text strong><CalendarOutlined /> {cls.schedule}</Text>
                            <Text strong><ClockCircleOutlined /> {cls.time}</Text>
                            <Text strong><DollarOutlined /> Học phí: {parseFloat(cls.hocphi || 0).toLocaleString()} VNĐ</Text>
                            {isAdmin && <Tag color="orange" style={{marginTop: 5}}>CLB: {cls.maclb || 'Chung'}</Tag>}
                          </Space>
                          <div style={{ textAlign: 'right' }}>
                            <Title level={2} style={{ color: '#1d39c4', margin: 0 }}>{(classStudents[cls.id] || []).length}</Title>
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </>
              ) : (
                <>
                  <Button icon={<ArrowLeftOutlined />} onClick={() => {setSelectedClass(null); setSelectedStudentKeys([]);}} style={{ marginBottom: 15 }}>Quay lại</Button>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' }}>
                    <Title level={4} style={{margin:0}}>Lớp: {selectedClass.name}</Title>
                    <Space>
                      {selectedStudentKeys.length > 0 && (
                        <>
                          <Button type="primary" style={{background: '#52c41a', borderColor: '#52c41a'}} icon={<StarOutlined />} onClick={() => {
                            if(availableExamsForClass.length === 0) return message.warning("CLB này chưa có Kỳ thi nào. Hãy tạo mã kỳ thi trước!");
                            registerExamForm.resetFields(); setIsRegisterExamOpen(true);
                          }}>Đăng ký Thi ({selectedStudentKeys.length})</Button>
                          <Button icon={<DownloadOutlined />} onClick={() => {
                            const toExport = displayClassStudents.filter(s => selectedStudentKeys.includes(s.key));
                            const ws = XLSX.utils.json_to_sheet(toExport);
                            const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Lop");
                            XLSX.writeFile(wb, `Lop_${selectedClass.name}.xlsx`);
                          }}>Tải danh sách chọn</Button>
                          <Popconfirm title="Xóa võ sinh khỏi lớp?" onConfirm={() => {
                            const filtered = (classStudents[selectedClass.id] || []).filter(s => !selectedStudentKeys.includes(s.key));
                            const up = { ...classStudents, [selectedClass.id]: filtered };
                            setClassStudents(up); localStorage.setItem('vtf_class_students', JSON.stringify(up)); setSelectedStudentKeys([]);
                          }}><Button danger icon={<DeleteOutlined />}>Xóa</Button></Popconfirm>
                        </>
                      )}
                      <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddStudentOpen(true)}>Thêm Võ Sinh</Button>
                    </Space>
                  </div>
                  <Table 
                    rowKey="key" rowSelection={{ selectedRowKeys: selectedStudentKeys, onChange: setSelectedStudentKeys }} 
                    dataSource={displayClassStudents} bordered pagination={false}
                    columns={[
                      { title: 'STT', key: 'stt', width: 60, render: (t,r,i) => i+1 },
                      { title: 'Sửa', width: 60, render: (t, r) => <EditOutlined style={{color:'#1890ff', cursor:'pointer'}} onClick={() => { 
                          const info = dataSource.find(d => String(d.mahv) === String(r.mahv));
                          const fullData = info ? { ...info, key: r.key, trangthai: r.trangthai || 'Hoạt động' } : { ...r, trangthai: r.trangthai || 'Hoạt động' };
                          setEditingClassStudent(fullData); classStudentEditForm.setFieldsValue(fullData); setIsClassStudentEditOpen(true); 
                        }} /> 
                      },
                      { title: 'Mã HV', dataIndex: 'mahv', render: t => (!t || t === "Chưa có") ? <Tag>Chưa có</Tag> : <b style={{color:'#1d39c4'}}>{t}</b> },
                      { title: 'Họ tên', dataIndex: 'hoten' },
                      { title: 'Giới tính', dataIndex: 'gioitinh' },
                      { title: 'Ngày sinh', dataIndex: 'ngaysinh', render: t => formatDate(t) },
                      { title: 'Đẳng cấp', dataIndex: 'capdang', render: t => <Tag color="blue">{t}</Tag> },
                      { 
                        title: 'Trạng thái', dataIndex: 'trangthai', width: 150,
                        render: (t, r) => (
                          <Select 
                            value={t || 'Hoạt động'} bordered={false} style={{ width: '100%' }}
                            onChange={(val) => {
                              const updated = (classStudents[selectedClass.id] || []).map(s => s.key === r.key ? { ...s, trangthai: val } : s);
                              const newMap = { ...classStudents, [selectedClass.id]: updated };
                              setClassStudents(newMap); localStorage.setItem('vtf_class_students', JSON.stringify(newMap));
                            }}
                            options={[
                              { value: 'Hoạt động', label: <Tag color="green">Hoạt động</Tag> },
                              { value: 'Tạm ngưng', label: <Tag color="orange">Tạm ngưng</Tag> },
                              { value: 'Không còn sinh hoạt', label: <Tag color="red">Không còn SH</Tag> }
                            ]}
                          />
                        )
                      }
                    ]}
                  />
                </>
              )}
            </div>
          ) : activeMenu === 'hocphi' ? (
             <div style={{ background: '#fff', padding: '20px', borderRadius: 8, minHeight:'80vh' }}>
                <Tabs items={[
                  { key: '1', label: 'Quản lý Học Phí Lớp', children: (
                    !selectedFeeClass ? (
                      <Row gutter={[16, 20]}>
                        {filteredClasses.map(cls => {
                          const feePerStudent = parseFloat(cls.hocphi) || 0;
                          const students = (classStudents[cls.id] || []).filter(s => s.trangthai === 'Hoạt động');
                          const cFeeData = hocphiData[cls.id] || {};
                          let paidCount = 0; let unpaidCount = 0; let debtCount = 0;
                          
                          students.forEach(s => {
                            const status = cFeeData[s.key]?.status || 'Chưa đóng';
                            if (status === 'Đã đóng') paidCount++; else if (status === 'Cho nợ') debtCount++; else unpaidCount++;
                          });
                          
                          const totalCollected = paidCount * feePerStudent;
                          const totalDebt = (unpaidCount + debtCount) * feePerStudent;

                          return (
                            <Col span={8} key={cls.id}>
                              <Card hoverable style={{ borderRadius: 12, borderLeft: '6px solid #52c41a' }} onClick={() => setSelectedFeeClass(cls)}>
                                <Title level={5}>{cls.name}</Title>
                                <Tag color="orange" style={{marginRight: 8}}>CLB: {cls.maclb || 'Chung'}</Tag>
                                <Tag color="blue">Mức thu: {feePerStudent.toLocaleString()} đ</Tag>
                                <Divider style={{margin:'10px 0'}} />
                                <Row><Col span={12}><Text type="secondary">Tổng VS:</Text> <b>{students.length}</b></Col><Col span={12}><Text type="success">Đã đóng:</Text> <b>{paidCount}</b></Col><Col span={12}><Text type="warning">Cho nợ:</Text> <b>{debtCount}</b></Col><Col span={12}><Text type="danger">Chưa đóng:</Text> <b>{unpaidCount}</b></Col></Row>
                                <Divider style={{margin:'10px 0'}} /><div><Text type="success">Tổng thu: {totalCollected.toLocaleString()} VNĐ</Text></div><div><Text type="danger">Tổng nợ: {totalDebt.toLocaleString()} VNĐ</Text></div>
                              </Card>
                            </Col>
                          )
                        })}
                      </Row>
                    ) : (
                      <>
                        <Button icon={<ArrowLeftOutlined />} onClick={() => setSelectedFeeClass(null)} style={{ marginBottom: 15 }}>Quay lại</Button>
                        <Title level={4}>Chi tiết học phí Lớp: {selectedFeeClass.name}</Title>
                        <Table dataSource={(classStudents[selectedFeeClass.id] || []).filter(s => s.trangthai === 'Hoạt động')} rowKey="key" bordered
                          columns={[
                            { title: 'Mã HV', dataIndex: 'mahv', render: t => <b>{t}</b> }, { title: 'Họ tên', dataIndex: 'hoten' },
                            { title: 'Số tháng nợ', render: (t, r) => { const debtM = hocphiData[selectedFeeClass.id]?.[r.key]?.debtMonths || 0; return <Tag color={debtM >= 2 ? 'red' : 'orange'}>{debtM} tháng</Tag>; }},
                            { title: 'Trạng thái', render: (t, r) => {
                                const cData = hocphiData[selectedFeeClass.id]?.[r.key] || {}; const currentStatus = cData.status || 'Chưa đóng'; const debtM = cData.debtMonths || 0;
                                return ( <Select value={currentStatus} style={{width: 150}} onChange={(val) => updateStudentFeeStatus(selectedFeeClass.id, r.key, val)}><Select.Option value="Đã đóng"><Text type="success">Đã đóng</Text></Select.Option><Select.Option value="Chưa đóng"><Text type="danger">Chưa đóng</Text></Select.Option><Select.Option value="Cho nợ" disabled={debtM >= 2}><Text type="warning">Cho nợ</Text></Select.Option></Select> )
                            }}
                          ]}
                        />
                      </>
                    )
                  )},
                  { key: '2', label: 'Lệ Phí Thi Cấp', children: (
                     !selectedFeeExam ? (
                      <Row gutter={[16, 20]}>
                        {filteredExams.filter(e => e.examCategory !== 'Đẳng').map(ex => {
                          const fee = parseFloat(ex.lephi) || 0;
                          const cands = examCandidates[ex.code] || [];
                          return (
                            <Col span={8} key={ex.id}>
                              <Card style={{ borderRadius: 12, borderLeft: '6px solid #eb2f96' }}>
                                <div style={{display:'flex', justifyContent:'space-between'}}>
                                  <Title level={5} style={{margin:0}}>{ex.name}</Title>
                                  <EditOutlined style={{color:'#1890ff', cursor:'pointer'}} onClick={() => { feeEditForm.setFieldsValue({lephi: ex.lephi}); setEditingRecord(ex); setIsEditFeeModalOpen(true); }}/>
                                </div>
                                <p style={{marginTop: 10}}>Mã kỳ thi: <Tag color="volcano">{ex.code}</Tag> | CLB: <Tag color="blue">{ex.maclb}</Tag></p>
                                <p>Lệ phí: <b>{fee.toLocaleString()} VNĐ / VS</b></p>
                                <p>Số lượng đăng ký: <b>{cands.length} VS</b></p>
                                <Divider style={{margin:'10px 0'}} />
                                <Title level={4} type="success" style={{margin:0, marginBottom:15}}>Tổng thu: {(fee * cands.length).toLocaleString()} VNĐ</Title>
                                <Button block type="dashed" onClick={() => setSelectedFeeExam(ex)}>Chi tiết & Thêm VS</Button>
                              </Card>
                            </Col>
                          )
                        })}
                      </Row>
                     ) : (
                      <>
                        <Button icon={<ArrowLeftOutlined />} onClick={() => { setSelectedFeeExam(null); setSearchFeeStudent(''); }} style={{ marginBottom: 15 }}>Quay lại</Button>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center'}}>
                           <Title level={4} style={{margin: 0}}>Danh sách thu phí: {selectedFeeExam.name} ({selectedFeeExam.maclb})</Title>
                           <Space><Input.Search placeholder="Tìm tên/mã võ sinh..." allowClear onChange={e => setSearchFeeStudent(e.target.value)} style={{width: 250}} /><Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddExamStudentOpen(true)}>Thêm Võ Sinh</Button></Space>
                        </div>
                        <Table 
                          dataSource={(examCandidates[selectedFeeExam.code] || []).filter(c => (c.hoten || '').toLowerCase().includes(searchFeeStudent.toLowerCase()) || (c.mahv || '').toLowerCase().includes(searchFeeStudent.toLowerCase()))} 
                          rowKey="key" bordered size="small"
                          columns={[
                            { title: 'Mã HV', dataIndex: 'mahv', render: t => <b>{t}</b> }, { title: 'Họ tên', dataIndex: 'hoten' }, { title: 'Cấp Thi', dataIndex: 'capthi' },
                            { title: 'Lệ phí', render: () => <b>{(parseFloat(selectedFeeExam.lephi)||0).toLocaleString()} đ</b> },
                            { title: 'Xóa', width: 60, render: (t, r) => <Popconfirm title="Xóa?" onConfirm={() => { const up = (examCandidates[selectedFeeExam.code] || []).filter(c => c.key !== r.key); setExamCandidates({...examCandidates, [selectedFeeExam.code]: up}); localStorage.setItem('vtf_exam_candidates', JSON.stringify({...examCandidates, [selectedFeeExam.code]: up})); }}><DeleteOutlined style={{color:'red'}}/></Popconfirm> }
                          ]}
                        />
                      </>
                     )
                  )},
                  { key: '3', label: 'Lệ Phí Thi Đẳng', children: (
                     !selectedFeeExam ? (
                      <Row gutter={[16, 20]}>
                        {filteredExams.filter(e => e.examCategory === 'Đẳng').map(ex => {
                          const cands = examCandidates[ex.code] || [];
                          let totalFee = 0;
                          cands.forEach(c => { totalFee += parseInt(danFeesConfig[c.capthi]) || 0; });
                          return (
                            <Col span={8} key={ex.id}>
                              <Card style={{ borderRadius: 12, borderLeft: '6px solid #722ed1' }}>
                                <div style={{display:'flex', justifyContent:'space-between'}}>
                                  <Title level={5} style={{margin:0}}>{ex.name}</Title>
                                </div>
                                <p style={{marginTop: 10}}>Mã kỳ thi: <Tag color="purple">{ex.code}</Tag> | CLB: <Tag color="blue">{ex.maclb}</Tag></p>
                                <p>Lệ phí: <b style={{color: '#722ed1'}}>Tính theo Đẳng</b></p>
                                <p>Số lượng đăng ký: <b>{cands.length} VS</b></p>
                                <Divider style={{margin:'10px 0'}} />
                                <Title level={4} type="success" style={{margin:0, marginBottom:15}}>Tổng thu: {totalFee.toLocaleString()} VNĐ</Title>
                                <Button block type="dashed" onClick={() => setSelectedFeeExam(ex)}>Chi tiết & Thêm VS</Button>
                              </Card>
                            </Col>
                          )
                        })}
                      </Row>
                     ) : (
                      <>
                        <Button icon={<ArrowLeftOutlined />} onClick={() => { setSelectedFeeExam(null); setSearchFeeStudent(''); }} style={{ marginBottom: 15 }}>Quay lại</Button>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center'}}>
                           <Title level={4} style={{margin: 0}}>Danh sách thu phí: {selectedFeeExam.name} ({selectedFeeExam.maclb})</Title>
                           <Space><Input.Search placeholder="Tìm tên/mã võ sinh..." allowClear onChange={e => setSearchFeeStudent(e.target.value)} style={{width: 250}} /><Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddExamStudentOpen(true)}>Thêm Võ Sinh</Button></Space>
                        </div>
                        <Table 
                          dataSource={(examCandidates[selectedFeeExam.code] || []).filter(c => (c.hoten || '').toLowerCase().includes(searchFeeStudent.toLowerCase()) || (c.mahv || '').toLowerCase().includes(searchFeeStudent.toLowerCase()))} 
                          rowKey="key" bordered size="small"
                          columns={[
                            { title: 'Mã HV', dataIndex: 'mahv', render: t => <b>{t}</b> }, { title: 'Họ tên', dataIndex: 'hoten' }, { title: 'Cấp Thi', dataIndex: 'capthi' },
                            { title: 'Lệ phí', render: (t, r) => <b>{(parseInt(danFeesConfig[r.capthi])||0).toLocaleString()} đ</b> },
                            { title: 'Xóa', width: 60, render: (t, r) => <Popconfirm title="Xóa?" onConfirm={() => { const up = (examCandidates[selectedFeeExam.code] || []).filter(c => c.key !== r.key); setExamCandidates({...examCandidates, [selectedFeeExam.code]: up}); localStorage.setItem('vtf_exam_candidates', JSON.stringify({...examCandidates, [selectedFeeExam.code]: up})); }}><DeleteOutlined style={{color:'red'}}/></Popconfirm> }
                          ]}
                        />
                      </>
                     )
                  )},
                  ...(isAdmin ? [{ key: '4', label: 'Tổng hợp Hệ Thống (Admin)', children: (
                    <>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 15}}>
                         <Title level={5}>Doanh thu hiện tại</Title>
                         <Button type="primary" icon={<CloudUploadOutlined />} style={{background: '#52c41a'}} onClick={handleAdminChotSo} loading={loading}>Chốt Sổ & Lưu Google Sheet</Button>
                      </div>
                      <Table 
                        dataSource={getAdminSummary()} rowKey="maclb" bordered
                        summary={pageData => {
                          let totalHocPhi = 0; let totalNoHocPhi = 0; let totalThiCap = 0; let tongHV = 0; let tongThiCap = 0; let tongThiDang = 0;
                          pageData.forEach(s => { 
                            totalHocPhi+=s.thuHocPhi; totalNoHocPhi+=s.noHocPhi; totalThiCap+=s.thuThiCap; 
                            tongHV+=s.activeStudents; tongThiCap+=s.thiCapCount; tongThiDang+=s.thiDangCount;
                          });
                          return (
                            <Table.Summary.Row style={{background:'#fafafa'}}>
                              <Table.Summary.Cell index={0}><Text strong>TỔNG CỘNG</Text></Table.Summary.Cell>
                              <Table.Summary.Cell index={1}><Text strong>{tongHV}</Text></Table.Summary.Cell>
                              <Table.Summary.Cell index={2}><Text strong>{tongThiCap}</Text></Table.Summary.Cell>
                              <Table.Summary.Cell index={3}><Text strong>{tongThiDang}</Text></Table.Summary.Cell>
                              <Table.Summary.Cell index={4}><Text strong type="success">{totalHocPhi.toLocaleString()} đ</Text></Table.Summary.Cell>
                              <Table.Summary.Cell index={5}><Text strong type="danger">{totalNoHocPhi.toLocaleString()} đ</Text></Table.Summary.Cell>
                              <Table.Summary.Cell index={6}><Text strong style={{color: '#eb2f96'}}>{totalThiCap.toLocaleString()} đ</Text></Table.Summary.Cell>
                              <Table.Summary.Cell index={7}><Text strong style={{color: '#1d39c4'}}>{(totalHocPhi + totalThiCap).toLocaleString()} đ</Text></Table.Summary.Cell>
                            </Table.Summary.Row>
                          )
                        }}
                        columns={[
                          { title: 'Câu Lạc Bộ', dataIndex: 'maclb', render: t => <Tag color="blue">{t}</Tag> },
                          { title: 'Tổng Học Viên', dataIndex: 'activeStudents', render: t => <b>{t}</b> },
                          { title: 'SL Thi Cấp', dataIndex: 'thiCapCount', render: t => <b>{t}</b> },
                          { title: 'SL Thi Đẳng', dataIndex: 'thiDangCount', render: t => <b>{t}</b> },
                          { title: 'Thu Học Phí', dataIndex: 'thuHocPhi', render: t => <b style={{color:'green'}}>{t.toLocaleString()}</b> },
                          { title: 'Nợ Học Phí', dataIndex: 'noHocPhi', render: t => <b style={{color:'red'}}>{t.toLocaleString()}</b> },
                          { title: 'Thu Lệ Phí Thi', dataIndex: 'thuThiCap', render: t => <b>{t.toLocaleString()}</b> },
                          { title: 'TỔNG DOANH THU', render: (t, r) => <b style={{color:'#1d39c4'}}>{(r.thuHocPhi + r.thuThiCap).toLocaleString()}</b> }
                        ]}
                      />
                      <Divider />
                      <Title level={5}>Lịch sử Lệ phí thi từng đợt (Vĩnh viễn)</Title>
                      <Table 
                        dataSource={historicalFees} rowKey="id" size="small" bordered
                        columns={[
                           { title: 'Tháng/Năm', dataIndex: 'monthYear' },
                           { title: 'Mã CLB', dataIndex: 'maclb', render: t => <Tag>{t}</Tag> },
                           { title: 'Loại', dataIndex: 'examType' },
                           { title: 'Mã Tham Chiếu', dataIndex: 'examCode', render: t => <b style={{color: '#eb2f96'}}>{t}</b> },
                           { title: 'Số lượng', dataIndex: 'candsCount', render: t => <b>{t || 0}</b> },
                           { title: 'Doanh thu', dataIndex: 'revenue', render: t => <b style={{color: 'green'}}>{Number(t).toLocaleString()} đ</b> },
                           ...(isAdmin ? [{
                              title: 'Thao tác', width: 90, render: (t, r) => (
                                <Space>
                                  <EditOutlined style={{color: '#1890ff', cursor: 'pointer'}} onClick={() => { setEditingHistFee(r); histFeeForm.setFieldsValue(r); setIsEditHistFeeOpen(true); }} />
                                  <Popconfirm title="Xóa bản ghi này?" onConfirm={() => { const updated = historicalFees.filter(h => h.id !== r.id); setHistoricalFees(updated); localStorage.setItem('vtf_historical_fees', JSON.stringify(updated)); message.success("Đã xóa!"); }}>
                                    <DeleteOutlined style={{color: 'red', cursor: 'pointer'}} />
                                  </Popconfirm>
                                </Space>
                              )
                           }] : [])
                        ]}
                      />
                    </>
                  ) }] : [])
                ]} />
             </div>
          ) : activeMenu === 'baocao' ? (
            <div style={{ background: '#fff', padding: '20px', borderRadius: 8, minHeight:'80vh' }}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 20}}>
                 <Title level={4}>BÁO CÁO THỐNG KÊ</Title>
                 <Select value={reportQuarter} onChange={setReportQuarter} style={{width: 200}} placeholder="Chọn Tháng/Năm">
                    {reportQuartersList.map(q => <Select.Option key={q} value={q}>{q}</Select.Option>)}
                 </Select>
              </div>
              <Tabs items={[
                { key: '1', label: 'Biểu đồ Học Phí CLB', children: <CustomBarChart data={reportDataHocPhi} color="#1890ff" /> },
                { key: '2', label: 'Biểu đồ Doanh thu Thi Cấp', children: <CustomLineChart data={reportTrendThiCap} color="#fa8c16" /> },
                { key: '3', label: 'Thống kê Thi Đẳng', children: (
                    <Row gutter={[16, 16]}>
                      <Col span={8}>
                        <Card style={{textAlign:'center', background:'#f0f5ff', borderColor:'#adc6ff'}}>
                          <Statistic title="Tổng số lượng thi" value={reportDanStats.total} valueStyle={{color: '#1d39c4', fontSize: 32, fontWeight: 'bold'}} />
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card style={{textAlign:'center', background:'#f6ffed', borderColor:'#b7eb8f'}}>
                          <Statistic title="Số lượng Đạt" value={reportDanStats.passed} valueStyle={{color: '#52c41a', fontSize: 32, fontWeight: 'bold'}} />
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card style={{textAlign:'center', background:'#fff1f0', borderColor:'#ffa39e'}}>
                          <Statistic title="Số lượng Không Đạt" value={reportDanStats.failed} valueStyle={{color: '#f5222d', fontSize: 32, fontWeight: 'bold'}} />
                        </Card>
                      </Col>
                    </Row>
                )}
              ]} />
            </div>
          ) : activeMenu === 'thicap' ? renderExamSection("CẤP", "Cấp")
            : activeMenu === 'thidang' ? renderExamSection("ĐẲNG", "Đẳng")
            : activeMenu === 'tracuu' ? (
            <div style={{ background: '#fff', padding: '20px', borderRadius: 8, minHeight:'80vh' }}>
              <Title level={4}><DatabaseOutlined /> TRA CỨU & LƯU TRỮ</Title>
              <Tabs items={[
                { key: '1', label: 'Tra cứu Hội viên', children: (
                  <div style={{padding: 20}}>
                     <div style={{textAlign: 'center', marginBottom: 20}}><Input.Search placeholder="Nhập Mã Hội Viên (VD: V26-010663) hoặc Mã Kỳ Thi (VD: Q2-2026)..." size="large" style={{maxWidth: 600}} allowClear enterButton="Tìm Kiếm" onChange={e => setSearchTracuu(e.target.value)} /></div>
                     <Table dataSource={traCuuHoiVienData} rowKey="key" bordered locale={{ emptyText: "Không tìm thấy dữ liệu thi phù hợp" }}
                        columns={[ { title: 'Mã kỳ thi', dataIndex: 'makythi', render: t => <Tag color="volcano">{t}</Tag> }, { title: 'Mã HV', dataIndex: 'mahv', render: t => <b style={{color: '#1d39c4'}}>{t}</b> }, { title: 'Họ và tên', dataIndex: 'hoten' }, { title: 'Cấp Thi', dataIndex: 'capthi' }, { title: 'Kết quả', dataIndex: 'ketqua', render: t => <Text strong type={t==='Đạt'?'success': (t&&t.includes('Không')?'danger':'warning')}>{t || "Chưa có"}</Text> } ]}
                     />
                  </div>
                )},
                { key: '2', label: 'Kho lưu PDF Kết quả thi', children: (
                  <Table dataSource={savedPDFs} rowKey="id" bordered locale={{ emptyText: "Chưa có file PDF nào được lưu." }}
                    columns={[
                      { title: 'Tên file PDF', dataIndex: 'name', render: t => <b style={{color: '#1d39c4'}}>{t}</b> },
                      { title: 'Thuộc kỳ thi', dataIndex: 'examCode', render: t => <Tag color="volcano">{t}</Tag> },
                      { title: 'Thời gian tải lên', dataIndex: 'date' },
                      { title: 'Thao tác', width: 200, render: (t, r) => (
                        <Space>
                          <Button type="primary" icon={<DownloadOutlined />} onClick={() => { const link = document.createElement('a'); link.href = r.data; link.download = r.name; link.click(); }}>Tải về</Button>
                          <Popconfirm title="Xóa vĩnh viễn file này?" onConfirm={() => { const updated = savedPDFs.filter(p => p.id !== r.id); setSavedPDFs(updated); localStorage.setItem('vtf_saved_pdfs', JSON.stringify(updated)); message.success("Đã xóa file PDF."); }}><Button danger icon={<DeleteOutlined />} /></Popconfirm>
                        </Space>
                      )}
                    ]} 
                  />
                )},
                { key: '3', label: 'Danh sách Mã Kỳ Thi đã lưu', children: (
                  <Table dataSource={exams} rowKey="id" bordered locale={{ emptyText: "Chưa có mã kỳ thi nào." }}
                    columns={[
                      { title: 'Mã kỳ thi', dataIndex: 'code', render: t => <Tag color="green">{t}</Tag> },
                      { title: 'Tên kỳ thi', dataIndex: 'name', render: t => <b>{t}</b> },
                      { title: 'Phân loại', dataIndex: 'examCategory', render: t => <Tag color={t === 'Đẳng' ? 'purple' : 'blue'}>{t}</Tag> },
                      { title: 'Mã CLB', dataIndex: 'maclb' },
                      { title: 'Số VS đăng ký', render: (t, r) => <b>{(examCandidates[r.code] || []).length}</b> },
                      { title: 'Thao tác', width: 200, render: (t, r) => (
                        <Space>
                          <Button type="dashed" onClick={() => {
                            navigator.clipboard.writeText(r.code);
                            message.success(`Đã copy mã: ${r.code}`);
                          }}>Copy Mã</Button>
                          
                          {isAdmin && (
                            <Popconfirm title="Bạn có chắc chắn muốn xóa kỳ thi này?" onConfirm={() => {
                              const updatedExams = exams.filter(e => e.id !== r.id);
                              setExams(updatedExams);
                              localStorage.setItem('vtf_exams', JSON.stringify(updatedExams));
                              message.success("Đã xóa kỳ thi thành công!");
                            }}>
                              <Button danger icon={<DeleteOutlined />} />
                            </Popconfirm>
                          )}
                        </Space>
                      )}
                    ]}
                  />
                )}
              ]} />
            </div>
          ) : activeMenu === 'thongbao' ? (
            <div style={{ background: '#fff', padding: '20px', borderRadius: 8, minHeight:'80vh' }}>
              <Row gutter={24}>
                {isAdmin && <Col span={9}><Card title="Soạn Thông Báo"><Form form={notiForm} layout="vertical" onFinish={(v) => { const n = { id: Date.now(), ...v, time: new Date().toLocaleString() }; const up = [n, ...notifications]; localStorage.setItem('vtf_notifications', JSON.stringify(up)); setNotifications(up); notiForm.resetFields(); message.success("Đã gửi!"); }}><Form.Item name="title" label="Tiêu đề" rules={[{required: true}]}><Input /></Form.Item><Form.Item name="content" label="Nội dung" rules={[{required: true}]}><TextArea rows={6} /></Form.Item><Button type="primary" htmlType="submit" block icon={<SendOutlined />}>Gửi</Button></Form></Card></Col>}
                <Col span={isAdmin ? 15 : 24}>
                  <Card title="Danh Sách Thông Báo">
                    <List itemLayout="vertical" dataSource={notifications} renderItem={item => (
                      <List.Item extra={isAdmin && <Popconfirm title="Xóa?" onConfirm={() => { const up = notifications.filter(x => x.id !== item.id); localStorage.setItem('vtf_notifications', JSON.stringify(up)); setNotifications(up); }}><Button danger icon={<DeleteOutlined />} /></Popconfirm>}>
                        <List.Item.Meta title={<b>{item.title}</b>} description={item.time} />
                        <div style={{background: '#f9f9f9', padding: 15, borderRadius: 8, whiteSpace: 'pre-wrap'}}>{item.content}</div>
                      </List.Item>
                    )} />
                  </Card>
                </Col>
              </Row>
            </div>
          ) : activeMenu === 'caidat' && isSuperAdmin ? (
            <div style={{ background: '#fff', padding: '20px', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}><Title level={4}>Quản Lý Tài Khoản</Title><Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingRecord(null); form.resetFields(); setIsUserEditOpen(true); }}>Thêm User</Button></div>
              <Table dataSource={userList} rowKey="username" columns={[
                { title: 'Tài khoản', dataIndex: 'username', render: t => <b>{t}</b> }, { title: 'Họ tên', dataIndex: 'hoten' }, { title: 'CLB', dataIndex: 'clb' }, { title: 'Loại', dataIndex: 'role', render: r => <Tag color={r.includes('ADMIN') ? 'red' : 'blue'}>{r}</Tag> }, 
                { title: 'Quyền', render: (r) => (<Space>{r.canEdit && <Tag color="green">Sửa</Tag>}{r.canImport && <Tag color="purple">Import</Tag>}{r.canExport && <Tag color="orange">Export</Tag>}</Space>)}, 
                { title: 'Thao tác', width: 90, render: (r) => ( 
                  <Space>
                    <EditOutlined onClick={() => { setEditingRecord(r); form.setFieldsValue(r); setIsUserEditOpen(true); }} disabled={r.username === 'admin'} />
                    <Popconfirm title="Xóa tài khoản?" onConfirm={() => { const up = userList.filter(u => u.username !== r.username); setUserList(up); localStorage.setItem('vtf_users', JSON.stringify(up)); message.success("Đã xóa user"); }} disabled={r.username === 'admin'}><DeleteOutlined style={{color: r.username==='admin'?'grey':'red'}}/></Popconfirm>
                  </Space> 
                )}
              ]} />
            </div>
          ) : <div style={{textAlign:'center', marginTop:100}}><Title level={3} type="secondary">Tính năng đang phát triển...</Title></div>}
        </Content>
      </Layout>

      {/* --- MODALS --- */}
      <Modal title="Cấu hình Phí Thi Đẳng" open={isDanFeeConfigOpen} onCancel={() => setIsDanFeeConfigOpen(false)} onOk={() => danFeeConfigForm.submit()}><Form form={danFeeConfigForm} layout="vertical" initialValues={danFeesConfig} onFinish={(v) => { setDanFeesConfig(v); localStorage.setItem('vtf_dan_fees', JSON.stringify(v)); setIsDanFeeConfigOpen(false); message.success("Đã cập nhật bảng phí Thi Đẳng!"); }}><Row gutter={16}>{["1 Đẳng", "2 Đẳng", "3 Đẳng", "4 Đẳng", "5 Đẳng", "6 Đẳng", "7 Đẳng", "8 Đẳng", "9 Đẳng"].map(level => (<Col span={12} key={level}><Form.Item name={level} label={`Lệ phí lên ${level} (VNĐ)`} rules={[{required: true}]}><Input type="number" /></Form.Item></Col>))}</Row></Form></Modal>

      <Modal title={`Đăng ký Thi Thăng Đẳng (${selectedRowKeys.length} võ sinh)`} open={isRegisterDanMainOpen} onCancel={() => setIsRegisterDanMainOpen(false)} onOk={() => registerDanMainForm.submit()}><Form form={registerDanMainForm} layout="vertical" onFinish={handleRegisterDanMainSubmit}><Form.Item name="examCode" label="Chọn Kỳ Thi Đẳng" rules={[{required: true}]}><Select placeholder="-- Lựa chọn kỳ thi --">{filteredExams.filter(e => e.examCategory === 'Đẳng').map(e => <Select.Option key={e.id} value={e.code}>{e.name} - {e.maclb} ({e.code})</Select.Option>)}</Select></Form.Item><Text type="secondary">*Hệ thống sẽ tự động tính Cấp Đẳng tiếp theo cho từng võ sinh (vd: Cấp 1 -> 1 Đẳng, 1 Đẳng -> 2 Đẳng...)</Text></Form></Modal>

      <Modal title={editingRecord ? "Sửa Tài Khoản" : "Thêm User"} open={isUserEditOpen} onCancel={() => setIsUserEditOpen(false)} onOk={() => form.validateFields().then(v => { const role = v.isAdminPhu ? 'ADMIN_PHU' : 'NGƯỜI DÙNG'; const up = editingRecord ? userList.map(u => u.username === editingRecord.username ? { ...u, ...v, role } : u) : [...userList, { ...v, role }]; localStorage.setItem('vtf_users', JSON.stringify(up)); setUserList(up); setIsUserEditOpen(false); })}><Form form={form} layout="vertical"><Form.Item name="username" label="Tên đăng nhập" rules={[{required: true}]}><Input disabled={!!editingRecord}/></Form.Item><Form.Item name="hoten" label="Họ tên" rules={[{required: true}]}><Input /></Form.Item><Form.Item name="clb" label="Mã CLB"><Input placeholder="VD: CLB_00018" /></Form.Item><Form.Item name="password" label="Mật khẩu" initialValue="1"><Input.Password /></Form.Item><Form.Item name="isAdminPhu" valuePropName="checked"><Checkbox>Quyền Admin phụ</Checkbox></Form.Item><Form.Item label="Quyền chức năng"><Space><Form.Item name="canEdit" valuePropName="checked" noStyle><Checkbox>Sửa</Checkbox></Form.Item><Form.Item name="canImport" valuePropName="checked" noStyle><Checkbox>Import</Checkbox></Form.Item><Form.Item name="canExport" valuePropName="checked" noStyle><Checkbox>Export</Checkbox></Form.Item></Space></Form.Item></Form></Modal>

      <Modal title="Sửa Lịch sử Doanh thu" open={isEditHistFeeOpen} onCancel={() => setIsEditHistFeeOpen(false)} onOk={() => histFeeForm.submit()}><Form form={histFeeForm} layout="vertical" onFinish={(v) => { const payload = { ...v, candsCount: parseInt(v.candsCount, 10) || 0, revenue: parseFloat(v.revenue) || 0 }; const updated = historicalFees.map(h => h.id === editingHistFee.id ? { ...h, ...payload } : h); setHistoricalFees(updated); localStorage.setItem('vtf_historical_fees', JSON.stringify(updated)); setIsEditHistFeeOpen(false); message.success("Đã cập nhật!"); }}><Form.Item name="monthYear" label="Tháng/Năm" rules={[{required: true}]}><Input /></Form.Item><Form.Item name="maclb" label="Mã CLB" rules={[{required: true}]}><Input /></Form.Item><Form.Item name="examType" label="Loại thi" rules={[{required: true}]}><Input /></Form.Item><Form.Item name="examCode" label="Mã Kỳ thi" rules={[{required: true}]}><Input /></Form.Item><Form.Item name="candsCount" label="Số lượng VS"><Input type="number" /></Form.Item><Form.Item name="revenue" label="Doanh thu (VNĐ)"><Input type="number" /></Form.Item></Form></Modal>

      <Modal title="Sửa thông tin Kỳ thi" open={isEditFeeModalOpen} onCancel={() => setIsEditFeeModalOpen(false)} onOk={() => feeEditForm.submit()}><Form form={feeEditForm} layout="vertical" onFinish={(v) => { const up = exams.map(e => e.id === editingRecord.id ? {...e, ...v} : e); setExams(up); localStorage.setItem('vtf_exams', JSON.stringify(up)); setIsEditFeeModalOpen(false); }}><Form.Item name="lephi" label="Lệ phí thi / võ sinh (VNĐ)" rules={[{required: true}]}><Input type="number" /></Form.Item></Form></Modal>
      
      <Modal title="Thêm võ sinh vào lệ phí thi" open={isAddExamStudentOpen} onCancel={() => setIsAddExamStudentOpen(false)} onOk={() => examStudentForm.submit()}><Form form={examStudentForm} layout="vertical" onFinish={(v) => { const info = dataSource.find(d => String(d.mahv) === String(v.mahv)); if (!info) return message.error("Không tìm thấy mã hội viên này trong hệ thống!"); const exists = (examCandidates[selectedFeeExam.code] || []).some(c => c.mahv === v.mahv); if (exists) return message.warning("Võ sinh này đã có trong danh sách!"); const newCand = { key: Math.random() + Date.now(), capthi: calculateExamLevel(info.capdang), mahv: info.mahv, hoten: info.hoten, ngaysinh: info.ngaysinh, gioitinh: info.gioitinh, makythi: selectedFeeExam.code, ketqua: "", capdang: info.capdang }; const updated = [...(examCandidates[selectedFeeExam.code] || []), newCand].sort(sortStudents); setExamCandidates({ ...examCandidates, [selectedFeeExam.code]: updated }); localStorage.setItem('vtf_exam_candidates', JSON.stringify({ ...examCandidates, [selectedFeeExam.code]: updated })); setIsAddExamStudentOpen(false); examStudentForm.resetFields(); message.success("Đã thêm!"); }}><Form.Item name="mahv" label="Nhập Mã Hội Viên" rules={[{required: true}]}><Input placeholder="VD: V23-087650" /></Form.Item></Form></Modal>

      <Modal title={editingRecord ? "Sửa Kỳ Thi" : "Tạo Mã Kỳ Thi Mới"} open={isExamModalOpen} onCancel={() => setIsExamModalOpen(false)} onOk={() => examForm.submit()}><Form form={examForm} layout="vertical" onFinish={(v) => { let up = editingRecord ? exams.map(e => e.id === editingRecord.id ? {...e, ...v} : e) : [{id: Date.now(), ...v}, ...exams]; setExams(up); localStorage.setItem('vtf_exams', JSON.stringify(up)); setIsExamModalOpen(false); }}><Form.Item name="examCategory" label="Loại kỳ thi" initialValue="Cấp"><Select><Select.Option value="Cấp">Thi Thăng Cấp</Select.Option><Select.Option value="Đẳng">Thi Thăng Đẳng</Select.Option></Select></Form.Item><Form.Item name="code" label="Mã kỳ thi" rules={[{required: true}]}><Input /></Form.Item><Form.Item name="maclb" label="Mã CLB" rules={[{required: true}]}><Input /></Form.Item><Form.Item name="name" label="Tên kỳ thi" rules={[{required: true}]}><Input /></Form.Item><Form.Item noStyle dependencies={['examCategory']}>{({ getFieldValue }) => getFieldValue('examCategory') === 'Cấp' ? <Form.Item name="lephi" label="Lệ phí thi Cấp / võ sinh (VNĐ)" initialValue={0}><Input type="number" /></Form.Item> : <Text type="secondary" style={{display:'block', marginBottom:20}}>* Lệ phí Thi Đẳng sẽ được tính theo bảng giá tùy chỉnh trong menu Thi Đẳng.</Text>}</Form.Item></Form></Modal>

      <Modal title={`Đăng ký thi cho ${selectedStudentKeys.length} võ sinh`} open={isRegisterExamOpen} onCancel={() => setIsRegisterExamOpen(false)} onOk={() => registerExamForm.submit()}><Form form={registerExamForm} layout="vertical" onFinish={handleRegisterExamSubmit}><Form.Item name="examCode" label="Chọn Kỳ Thi" rules={[{required: true}]}><Select placeholder="-- Lựa chọn kỳ thi --">{availableExamsForClass.length > 0 ? availableExamsForClass.map(e => <Select.Option key={e.id} value={e.code}>{e.name} - {e.maclb} ({e.code})</Select.Option>) : <Select.Option disabled value="">Không có kỳ thi nào thuộc CLB này</Select.Option>}</Select></Form.Item></Form></Modal>

      <Modal title="Cảnh báo: Có học viên chưa được đăng ký" open={isPdfWarningOpen} onOk={() => { executePdfUpdates(pendingUpdates, pendingPdfFile); setIsPdfWarningOpen(false); }} onCancel={() => { setIsPdfWarningOpen(false); setPendingUpdates([]); setMissingCands([]); setPendingPdfFile(null); }} okText="Xác nhận bỏ qua và Cập nhật" cancelText="Hủy"><p>Các mã học viên sau có trong file PDF nhưng <b>chưa có</b> trong danh sách đăng ký thi này:</p><ul style={{ maxHeight: 200, overflowY: 'auto' }}>{missingCands.map(c => <li key={c.mahv}><b>{c.mahv}</b> - {c.capthi} (Kết quả: {c.ketqua})</li>)}</ul><p style={{ color: 'red' }}>Bạn có muốn bỏ qua những võ sinh này và tiếp tục cập nhật những người hợp lệ không?</p></Modal>

      <Modal title="Lớp Học" open={isAddClassOpen || isClassEditOpen} onCancel={() => {setIsAddClassOpen(false); setIsClassEditOpen(false)}} onOk={() => classForm.submit()}><Form form={classForm} layout="vertical" onFinish={(v) => { let up = isClassEditOpen ? classes.map(c => c.id === editingRecord.id ? {...c, ...v} : c) : [...classes, {id: Date.now(), ...v}]; setClasses(up); localStorage.setItem('vtf_classes', JSON.stringify(up)); setIsAddClassOpen(false); setIsClassEditOpen(false); }}><Form.Item name="name" label="Tên lớp" rules={[{required: true}]}><Input /></Form.Item><Form.Item name="schedule" label="Lịch tập" rules={[{required: true}]}><Input /></Form.Item><Form.Item name="time" label="Giờ tập" rules={[{required: true}]}><Input /></Form.Item><Form.Item name="maclb" label="Mã CLB"><Input /></Form.Item><Form.Item name="hocphi" label="Giá học phí/tháng (VNĐ)" initialValue={0}><Input type="number" /></Form.Item></Form></Modal>

      <Modal title="Thông tin hội viên" open={isClassStudentEditOpen} onCancel={() => setIsClassStudentEditOpen(false)} width={1000} onOk={() => classStudentEditForm.submit()} okText="Cập nhật" cancelText="Đóng"><Form form={classStudentEditForm} layout="vertical" onFinish={handleEditClassStudentSubmit}><Text type="warning" style={{display:'block', marginBottom: 15}}>Hệ thống sẽ tự động trích xuất thông tin CLB của lớp này để gắn cho hội viên.</Text><Row gutter={16}><Col span={8}><Form.Item name="mahv_cu" label="Mã hội viên (cũ)"><Input /></Form.Item></Col><Col span={8}><Form.Item name="hoten" label="Họ và tên *" rules={[{required:true}]}><Input /></Form.Item></Col><Col span={8}><Form.Item name="ngaysinh" label="Ngày sinh *"><Input /></Form.Item></Col></Row><Row gutter={16}><Col span={8}><Form.Item name="mahv" label="Mã hội viên"><Input /></Form.Item></Col><Col span={8}><Form.Item name="capdang" label="Cấp đẳng hiện tại *"><Select placeholder="Chọn cấp/đẳng">{DANH_SACH_CAP_DANG.map(level => <Select.Option key={level} value={level}>{level}</Select.Option>)}</Select></Form.Item></Col><Col span={8}><Form.Item name="trangthai" label="Trạng thái"><Select><Select.Option value="Hoạt động">Hoạt động</Select.Option><Select.Option value="Tạm ngưng">Tạm ngưng</Select.Option><Select.Option value="Không còn sinh hoạt">Không còn sinh hoạt</Select.Option></Select></Form.Item></Col></Row><Row gutter={16}><Col span={8}><Form.Item name="gioitinh" label="Giới tính *"><Select><Select.Option value="Nam">Nam</Select.Option><Select.Option value="Nữ">Nữ</Select.Option></Select></Form.Item></Col><Col span={8}><Form.Item name="sdt" label="Số điện thoại"><Input /></Form.Item></Col><Col span={8}><Form.Item name="email" label="Email"><Input /></Form.Item></Col></Row><Row gutter={16}><Col span={8}><Form.Item name="magal" label="Mã GAL"><Input /></Form.Item></Col><Col span={8}><Form.Item name="magsgk" label="Mã GSGK"><Input /></Form.Item></Col><Col span={8}><Form.Item name="cccd" label="CMND/CCCD"><Input /></Form.Item></Col></Row><Row gutter={16}><Col span={8}><Form.Item name="matrongtai" label="Mã trọng tài"><Input /></Form.Item></Col><Col span={8}><Form.Item name="mahlv" label="Mã HLV"><Input /></Form.Item></Col><Col span={8}><Form.Item name="sovbkukkiwon" label="Số VB Kukkiwon"><Input /></Form.Item></Col></Row><Row gutter={16}><Col span={8}><Form.Item name="trinhdovanhoa" label="Trình độ văn hóa"><Input /></Form.Item></Col><Col span={8}><Form.Item name="ngaythamgia" label="Ngày tham gia"><Input /></Form.Item></Col><Col span={8}><Form.Item name="diachi" label="Địa chỉ"><Input /></Form.Item></Col></Row><Row gutter={16}><Col span={24}><Form.Item name="ghichu" label="Ghi chú"><Input.TextArea rows={2} /></Form.Item></Col></Row></Form></Modal>

      <Modal title="Thêm Võ Sinh" open={isAddStudentOpen} onCancel={() => setIsAddStudentOpen(false)} footer={null}><Tabs items={[{ key: '1', label: 'Từng người', children: <Form form={studentForm} onValuesChange={handleStudentFormChange} onFinish={(v) => { const currentStudents = classStudents[selectedClass.id] || []; if (v.mahv && currentStudents.some(s => String(s.mahv) === String(v.mahv))) return message.error("Đã có trong lớp!"); const info = dataSource.find(d => String(d.mahv) === String(v.mahv)); const clubInfo = getTargetClubInfo(); const ns = { key: Date.now(), mahv: v.mahv || "Chưa có", hoten: info ? info.hoten : v.hoten, ngaysinh: info ? info.ngaysinh : (v.ngaysinh || ""), capdang: info ? info.capdang : "Chưa xác định", maclb: clubInfo.maclb, tenclb: clubInfo.tenclb, trangthai: "Hoạt động" }; const up = { ...classStudents, [selectedClass.id]: [...currentStudents, ns] }; setClassStudents(up); localStorage.setItem('vtf_class_students', JSON.stringify(up)); setIsAddStudentOpen(false); studentForm.resetFields(); }} layout="vertical"><Form.Item name="mahv" label="Mã HV"><Input /></Form.Item><Form.Item name="hoten" label="Họ tên" rules={[{required: true}]}><Input /></Form.Item><Form.Item name="ngaysinh" label="Ngày sinh"><Input placeholder="VD: 01/01/2010" /></Form.Item><Button type="primary" htmlType="submit" block>Thêm</Button></Form> }, { key: '2', label: 'Excel Import', children: <div style={{textAlign:'center'}}><Text type="secondary" style={{display:'block', marginBottom:10}}>Cấu trúc file Excel: Cột A(STT), B(Mã HV), C(Họ tên), D(Ngày sinh)</Text><input type="file" ref={studentExcelRef} style={{display:'none'}} onChange={(e) => { const file = e.target.files[0]; const reader = new FileReader(); reader.onload = (ev) => { const wb = XLSX.read(ev.target.result, { type: 'binary' }); const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { raw: false }); const currentInClass = classStudents[selectedClass.id] || []; const ns = []; const clubInfo = getTargetClubInfo(); json.filter(r => r.hoten || r.mahv).forEach(row => { if (!row.mahv || !currentInClass.some(s => String(s.mahv) === String(row.mahv))) { const info = dataSource.find(d => String(d.mahv) === String(row.mahv)); ns.push({ key: Math.random(), mahv: row.mahv || (info ? info.mahv : "Chưa có"), hoten: info ? info.hoten : (row.hoten || "N/A"), ngaysinh: info ? info.ngaysinh : (row.ngaysinh || ""), capdang: info ? info.capdang : "Chưa xác định", maclb: clubInfo.maclb, tenclb: clubInfo.tenclb, trangthai: "Hoạt động" }); } }); const up = { ...classStudents, [selectedClass.id]: [...currentInClass, ...ns] }; setClassStudents(up); localStorage.setItem('vtf_class_students', JSON.stringify(up)); setIsAddStudentOpen(false); }; reader.readAsBinaryString(file); }} /><Button onClick={() => studentExcelRef.current.click()} icon={<FileExcelOutlined />} type="primary">Chọn file</Button></div> }]} /></Modal>

      <Modal title="Sửa Hội Viên Tổng" open={isMemberEditOpen} onCancel={() => setIsMemberEditOpen(false)} footer={null} width={600}><Form form={memberForm} layout="vertical" onFinish={(v) => { axios.patch(`${SHEETDB_URL}/mahv/${encodeURIComponent(editingMember.mahv)}`, { data: v }).then(() => { fetchData(user); setIsMemberEditOpen(false); message.success("Lưu!"); }); }}><Form.Item name="hoten" label="Họ tên"><Input /></Form.Item><Form.Item name="capdang" label="Cấp đẳng"><Select placeholder="Chọn cấp/đẳng">{DANH_SACH_CAP_DANG.map(level => <Select.Option key={level} value={level}>{level}</Select.Option>)}</Select></Form.Item><Button type="primary" htmlType="submit">Cập nhật</Button></Form></Modal>
    </Layout>
  );
};

export default App;
