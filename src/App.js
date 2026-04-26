import { Hono } from 'hono'
const app = new Hono()

// Thay link Google Script của bạn vào đây:
const URL_GS = 'https://script.google.com/macros/s/AKfycbzx3qdEL2RJnUxu7mCRe66rNzyzerbMEnspcZ7othoJs9l4CY2Qw4L3RFvHcezdISTj/exec';

app.get('/', (c) => c.html(`
  <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display:flex; justify-content:center; align-items:center; height:100vh; background: linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%); margin:0;">
    <div style="background:white; padding:40px 50px; border-radius:20px; box-shadow:0 15px 30px rgba(0,0,0,0.1); width:340px; text-align:center;">
      <h2 style="color:#1e293b; margin-bottom:10px; font-size:26px; font-weight:800;">HỆ THỐNG VTF</h2>
      <p style="color:#64748b; margin-bottom:30px; font-size:14px;">Đăng nhập để tiếp tục</p>
      <input type="text" id="username" placeholder="Tên đăng nhập (VD: admin)" style="width:100%; padding:14px; margin-bottom:15px; border:1px solid #cbd5e1; border-radius:10px; outline:none; transition:0.3s; box-sizing:border-box;">
      <input type="password" id="password" placeholder="Mật khẩu (VD: admin)" style="width:100%; padding:14px; margin-bottom:25px; border:1px solid #cbd5e1; border-radius:10px; outline:none; transition:0.3s; box-sizing:border-box;">
      <button onclick="login()" style="width:100%; padding:14px; background:#3b82f6; color:white; border:none; border-radius:10px; font-weight:bold; cursor:pointer; box-shadow:0 4px 10px rgba(59,130,246,0.3); transition:0.3s;">ĐĂNG NHẬP</button>
    </div>
    <script>
        function getSafeJSON(key, defaultVal) {
            try { let val = localStorage.getItem(key); return val ? JSON.parse(val) : defaultVal; } 
            catch(e) { return defaultVal; }
        }
        function login() {
            let u = document.getElementById('username').value.trim();
            let p = document.getElementById('password').value.trim();
            if(u === 'admin' && p === 'Jun2506') {
                localStorage.setItem('vtf_current_user', JSON.stringify({role: 'admin', name: 'Admin'}));
                location.href = '/menu';
                return;
            }
            let users = getSafeJSON('vtf_users', []);
            let found = users.find(x => x.u === u && x.p === p);
            if(found) {
                localStorage.setItem('vtf_current_user', JSON.stringify({role: 'user', name: u, perms: found.perms}));
                location.href = '/menu';
                return;
            }
            alert('Sai tài khoản hoặc mật khẩu!');
        }
        document.getElementById('password').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') login();
        });
    </script>
  </body>
`))

app.get('/menu', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Hệ Thống Quản Lý VĂN PHÒNG</title>
      <style>
        body { font-family: "Segoe UI", Roboto, sans-serif; margin: 0; display: flex; height: 100vh; background: #f8fafc; color:#334155;}
        .sidebar { width: 260px; background: #1e293b; color: #f8fafc; display: flex; flex-direction: column; position: fixed; height: 100%; z-index: 100; box-shadow: 4px 0 15px rgba(0,0,0,0.05); overflow-y: auto;}
        .sidebar-header { padding: 25px 20px; background: #0f172a; text-align: center; font-weight: 800; font-size: 18px; color: #38bdf8; border-bottom: 1px solid #334155; }
        .menu-item { padding: 16px 25px; border-bottom: 1px solid #334155; cursor: pointer; transition: all 0.3s ease; font-weight: 500; border-left: 4px solid transparent;}
        .menu-item:hover { background: #334155; border-left-color: #64748b;}
        .menu-item.active-menu { background: #3b82f6; color: white; border-left-color: #93c5fd; font-weight: bold;}
        .content { margin-left: 260px; flex: 1; padding: 40px; overflow-y: auto; }
        .form-container { background: white; padding: 40px 50px; margin: auto; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); color: black; display: none; width: 800px; max-width:100%; border: 1px solid #e2e8f0;}
        
        /* CỠ CHỮ CHUẨN NGHỊ ĐỊNH 30/2020/NĐ-CP */
        .c40-wrapper { font-family: "Times New Roman", Times, serif; font-size: 14pt; line-height: 1.5; color: #000; }
        .header-input { border: none !important; outline: none; background: transparent; font-family: "Times New Roman", Times, serif; font-size: 13pt; font-weight: bold; width: 100%; text-align: center; text-transform: uppercase; color: #000; }
        .dot-input { border: none; border-bottom: 1px dotted #64748b; outline: none; font-family: "Times New Roman", Times, serif; font-size: 14pt; background: transparent; transition: 0.3s; color:#000; }
        .dot-input:focus { border-bottom: 1px dashed #3b82f6; }
        input::-webkit-calendar-picker-indicator { display: none !important; opacity: 0; }
        .text-center { text-align: center; } .text-right { text-align: right; } .bold { font-weight: bold; }
        .footer-table { width: 100%; text-align: center; font-weight: bold; margin-bottom: 5px; }
        .footer-table td { width: 33%; vertical-align: top; padding-bottom: 5px; }
        .archive-tab { display: inline-block; padding: 10px 20px; background: #e2e8f0; border-radius: 8px; cursor: pointer; margin-right: 10px; font-weight: 600; color: #475569;}
        .archive-tab.active { background: #3b82f6; color: white; box-shadow: 0 4px 10px rgba(59,130,246,0.3);}
        .data-table { width: 100%; border-collapse: collapse; margin-top: 20px; font-family: "Segoe UI", sans-serif; font-size: 14px; border-radius:8px; overflow:hidden;}
        .data-table th, .data-table td { border-bottom: 1px solid #e2e8f0; padding: 12px 15px; text-align: left; vertical-align: middle;}
        .data-table th { background-color: #f1f5f9; color: #475569; text-transform: uppercase; font-size:13px; font-weight:700;}
        .btn-modern { padding:12px 25px; border-radius:8px; border:none; font-weight:bold; cursor:pointer; font-size:15px; transition:0.3s;}
        .btn-modern:hover { transform: translateY(-2px); }
        .btn-save { background: #10b981; color: white; box-shadow: 0 4px 10px rgba(16,185,129,0.3); }
        .btn-clear { background: #ef4444; color: white; box-shadow: 0 4px 10px rgba(239,68,68,0.3); }
        .btn-mini { padding: 6px 12px; border-radius: 5px; border: none; cursor: pointer; font-weight: bold; margin-right: 5px; transition: 0.2s;}

        #edit-back-bar { display:none; background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 20px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); align-items:center;}
        
        #dx_table, #bg_table, #xk_table, #nk_table { border-collapse: collapse; width: 100%; margin-bottom: 15px; }
        #dx_table th, #dx_table td, #bg_table th, #bg_table td, #xk_table th, #xk_table td, #nk_table th, #nk_table td { border: 1px solid #000 !important; padding: 6px; font-family: "Times New Roman", Times, serif; font-size: 14pt; }
        #dx_table th, #bg_table th, #xk_table th, #nk_table th { font-weight: bold; text-align: center; }
        #dx_table .dx-input, #bg_table .dx-input, #xk_table .dx-input, #nk_table .dx-input { width: 100%; border: none !important; outline: none; background: transparent; font-family: "Times New Roman", Times, serif; font-size: 14pt; box-sizing: border-box; }

        /* QUY TẮC ÉP KÍCH THƯỚC IN CHUẨN NGHỊ ĐỊNH & KHỔ GIẤY */
        @media print { 
          body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; width: 100%;}
          .sidebar, .btn-print, #welcome-msg, .no-print, #edit-back-bar { display: none !important; } 
          .content { margin: 0; padding: 0; width: 100%; max-width: 100%; overflow: visible; background:white;}
          .form-container { width: 100% !important; max-width: 100% !important; border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; border-radius:0;}
          .dot-input, .header-input { border-bottom: none !important; color:#000 !important; }
        }

        /* IN A4 2 BẢN: THU, CHI, BÀN GIAO (Chia đôi vừa vặn không rớt trang) */
        body.print-a4-double @media print {
          @page { size: A4 portrait; margin: 15mm; }
          .c40-wrapper { height: 48vh !important; overflow: hidden; box-sizing: border-box; zoom: 0.85; padding: 0 5mm; }
          .print-separator { display: block !important; border-top: 1px dashed #000; margin: 5mm 0; text-align: center; font-size: 10px; color: #555; height: 1vh;}
          .print-separator::after { content: '✂--------------------------------Cắt theo đường kẻ--------------------------------✂'; position: relative; top: -8px; background: white; padding: 0 10px; }
        }

        /* IN A4 1 BẢN: ĐỀ XUẤT, THANH TOÁN, XUẤT KHO, NHẬP KHO (Chuẩn lề NĐ 30) */
        body.print-a4-single @media print {
          @page { size: A4 portrait; margin: 20mm 15mm 20mm 30mm; } /* Lề: Trái 30, Phải 15, Trên/Dưới 20 */
          .c40-wrapper { height: auto !important; max-height: none; overflow: visible; zoom: 0.95; }
          .print-separator, .print-clone-area { display: none !important; }
        }

        /* IN A5 NGANG 1 BẢN */
        body.print-a5 @media print {
          @page { size: A5 landscape; margin: 15mm 15mm 15mm 20mm; } /* Lề đóng gáy bên trái */
          .c40-wrapper { height: auto !important; max-height: 98vh; overflow: hidden; zoom: 0.85; }
          .print-separator, .print-clone-area { display: none !important; }
        }
        
        .print-separator { display: none; }
      </style>
    </head>
    <body>

      <div id="datalists-container"></div>

      <div class="sidebar">
        <div class="sidebar-header">HỆ THỐNG QUẢN LÝ VĂN PHÒNG<br><small style="color:#94a3b8; font-size:12px; font-weight:normal;" id="user-welcome-name"></small></div>
        <div class="menu-item nav-btn" id="nav-thu" onclick="showTab('thu')">📝 1. Phiếu Thu</div>
        <div class="menu-item nav-btn" id="nav-chi" onclick="showTab('chi')">💸 2. Phiếu Chi</div>
        <div class="menu-item nav-btn" id="nav-dexuat" onclick="showTab('dexuat')">📋 3. Đề Xuất</div>
        <div class="menu-item nav-btn" id="nav-thanhtoan" onclick="showTab('thanhtoan')">💰 4. Đề Nghị Thanh Toán</div>
        <div class="menu-item nav-btn" id="nav-bangiao" onclick="showTab('bangiao')">📁 5. Biên Bản Bàn Giao</div>
        <div class="menu-item nav-btn" id="nav-xuat" onclick="showTab('xuat')">📤 6. Phiếu Xuất Kho</div>
        <div class="menu-item nav-btn" id="nav-nhap" onclick="showTab('nhap')">📥 7. Nhập Kho</div>
        <div class="menu-item nav-btn" id="nav-ton" onclick="showTab('ton')">📦 8. Quản Lý Kho</div>
        <div class="menu-item nav-btn" id="nav-thongbao" onclick="showTab('thongbao')">🔔 9. Thông Báo</div>
        <div class="menu-item nav-btn" id="nav-setting" onclick="showTab('setting')">⚙️ 10. Cài Đặt (Admin)</div>
        <div style="flex-grow:1"></div>
        <div class="menu-item nav-btn" id="nav-luutru" onclick="showTab('luutru')" style="background:#f59e0b; color:white; border-bottom:1px solid #d97706; border-left:none; font-weight:bold;">🗄️ 11. Kho Lưu trữ</div>
        <div onclick="logout()" style="padding:20px; color:#94a3b8; text-align:center; font-size:14px; cursor:pointer;">🚪 Đăng xuất</div>
      </div>

      <div class="content">
        <div id="edit-back-bar">
            <button onclick="cancelEdit()" style="padding: 8px 15px; background: #64748b; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; transition:0.2s;" onmouseover="this.style.background='#475569'" onmouseout="this.style.background='#64748b'">⬅ Trở về</button>
            <span style="margin-left: 15px; color: #d97706; font-weight: bold; font-style: italic;">Bạn đang ở chế độ chỉnh sửa...</span>
        </div>

        <div id="welcome-msg" class="text-center" style="color:#64748b; margin-top:100px;">
          <h2 style="font-size:28px; color:#0f172a;">Chào mừng đến với Hệ thống Quản lý</h2>
          <p>Vui lòng chọn chức năng ở menu bên trái</p>
        </div>

        <div id="form-thu" class="form-container form-doc">
          <div id="print-area-thu">
            <div class="c40-wrapper" id="c40-original-thu">
              <table style="width: 100%; margin-bottom: 5px; border: none;">
                <tr style="border: none;">
                  <td style="width: 60%; vertical-align: top; border: none;">
                    Đơn vị: <input type="text" id="pt_donvi" class="dot-input" style="width:380px;" list="dl_donvi" value="Liên đoàn Taekwondo Việt Nam"><br>
                    Mã QHNS: <input type="text" id="pt_maqhns" class="dot-input" style="width:350px;">
                  </td>
                  <td class="text-right" style="vertical-align: top; border: none;">
                    <div class="bold">Mẫu số: C40-BB</div>
                    <div style="font-size:10pt; font-weight:normal;">(Ban hành kèm theo Thông tư số 107/2017/TT-BTC)</div>
                  </td>
                </tr>
              </table>

              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <div style="width: 25%;"></div>
                <div class="text-center" style="width: 50%;">
                  <h2 style="margin-bottom:2px; margin-top:0; font-size:16pt;">PHIẾU THU</h2>
                  <i>Ngày <input type="text" id="pt_ngay" class="dot-input text-center auto-d" style="width:23px;"> tháng <input type="text" id="pt_thang" class="dot-input text-center auto-m" style="width:23px;"> năm <input type="text" id="pt_nam" class="dot-input text-center auto-y" style="width:38px;"></i><br>
                  Số: <input type="text" id="pt_sophieu" class="dot-input text-center bold" style="width:120px;" readonly>
                </div>
                <div class="text-right" style="width: 25%; line-height: 1.0;">
                  Quyển số: <input type="text" id="pt_quyen" class="dot-input text-center" style="width:50px;" value="1"><br>
                  Nợ: <input type="text" id="pt_no" class="dot-input" style="width:50px;"><br>
                  Có: <input type="text" id="pt_co" class="dot-input" style="width:50px;">
                </div>
              </div>

              <div style="line-height: 1.0; margin-bottom: 8px;">
                Họ và tên người nộp tiền: <input type="text" id="pt_tennguoinop" class="dot-input" style="width:70%; font-weight:bold;" list="dl_names" oninput="syncName('thu')"><br>
                Địa chỉ: <input type="text" id="pt_diachi" class="dot-input" style="width:89%;" list="dl_addresses"><br>
                Nội dung: <input type="text" id="pt_noidung" class="dot-input" style="width:88%;" list="dl_contents"><br>
                Số tiền: <input type="text" inputmode="numeric" id="pt_sotien_so" class="dot-input bold" style="width:65%;" oninput="handleMoneyInput(this, 'thu')"> (loại tiền) <input type="text" id="pt_loaitien" class="dot-input" style="width:80px;" value="VNĐ"><br>
                (viết bằng chữ): <input type="text" id="pt_sotien_chu" class="dot-input" style="width:83%; font-style:italic;" readonly><br>
                Kèm theo: <input type="text" id="pt_kemtheo" class="dot-input" style="width:76%;"> chứng từ gốc.
              </div>

              <table class="footer-table" style="border:none;">
                <tr style="border:none;">
                  <td style="border:none;">THỦ TRƯỞNG ĐƠN VỊ<br><div style="line-height: 1.0;"><small style="font-size:10pt; font-weight:normal;">(Ký, họ tên, đóng dấu)</small><br><br><br><br><br><input type="text" id="pt_ky_thutruong" class="dot-input text-center bold" style="width:80%;" list="dl_ky"></td>
                  <td style="border:none;">KẾ TOÁN TRƯỞNG<br><div style="line-height: 1.0;"><small style="font-size:10pt; font-weight:normal;">(Ký, họ tên)</small><br><br><br><br><br><input type="text" id="pt_ky_ketoan" class="dot-input text-center bold" style="width:80%;" list="dl_ky"></td>
                  <td style="border:none;">NGƯỜI LẬP<br><div style="line-height: 1.0;"><small style="font-size:10pt; font-weight:normal;">(Ký, họ tên)</small><br><br><br><br><br><input type="text" id="pt_ky_nguoilap" class="dot-input text-center bold" style="width:80%;" list="dl_ky"></td>
                </tr>
              </table>

              <div style="line-height: 0.8; margin-bottom: 8px;">
                Đã nhận đủ số tiền (Bằng số): <input type="text" id="pt_danhan_so" class="dot-input bold" style="width:300px;" readonly><br>
                - Bằng chữ: <input type="text" id="pt_danhan_chu" class="dot-input" style="width:85%; font-style:italic;" readonly>
              </div>

              <div style="display:flex; justify-content:space-between; font-weight:bold;">
                <div class="text-center" style="width:40%;">
                  NGƯỜI NỘP<br><small style="font-size:10pt; font-weight:normal;">(Ký, họ tên)</small><br><br><br><br>
                  <input type="text" id="pt_ky_nguoinop" class="dot-input text-center bold" style="width:80%;" readonly>
                </div>
                <div class="text-center" style="width:50%;">
                  <i style="font-weight:normal;">Ngày <input type="text" id="pt_ngay2" class="dot-input text-center auto-d" style="width:25px;"> tháng <input type="text" id="pt_thang2" class="dot-input text-center auto-m" style="width:25px;"> năm <input type="text" id="pt_nam2" class="dot-input text-center auto-y" style="width:40px;"></i><br>
                  THỦ QUỸ<br><small style="font-size:10pt; font-weight:normal;">(Ký, họ tên)</small><br><br><br>
                  <input type="text" id="pt_ky_thuquy" class="dot-input text-center bold" style="width:80%;" list="dl_ky">
                </div>
              </div>
            </div>
            <div id="print-clone-area-thu" class="print-clone-area"></div>
          </div>
          <div class="text-center btn-print" style="margin-top:30px; border-top: 1px solid #e2e8f0; padding-top:25px;">
            <p id="gsheet-status-thu" style="font-style:italic; display:none; margin-bottom:10px; font-weight:bold; color:#059669;"></p>
            <div style="display: flex; justify-content: center; align-items: center; gap: 15px;">
                <select id="print-format-thu" style="padding:12px; font-size:15px; border-radius:8px; border: 1px solid #cbd5e1; cursor: pointer; outline:none;">
                    <option value="A5">📄 In 1 bản (Khổ A5 ngang)</option>
                    <option value="A4">📄 In 2 bản (Khổ A4 dọc)</option>
                </select>
                <button onclick="savePrintAndReset()" class="btn-modern btn-save">💾 LƯU TRỮ VÀ IN</button>
                <button onclick="clearData()" class="btn-modern btn-clear">🔄 LÀM MỚI TỜ KHAI</button>
            </div>
          </div>
        </div>

        <div id="form-chi" class="form-container form-doc">
          <div id="print-area-chi">
            <div class="c40-wrapper" id="c40-original-chi">
              <table style="width: 100%; margin-bottom: 5px; border: none;">
                <tr style="border:none;">
                  <td style="width: 60%; vertical-align: top; border:none;">
                    Đơn vị: <input type="text" id="pc_donvi" class="dot-input" style="width:380px;" list="dl_donvi" value="Liên Đoàn Taekwondo Việt Nam"><br>
                    Mã QHNS: <input type="text" id="pc_maqhns" class="dot-input" style="width:350px;">
                  </td>
                  <td class="text-right" style="vertical-align: top; border:none;">
                    <div class="bold">Mẫu số: C41-BB</div>
                    <div style="font-size:9pt; font-weight:normal;">(Ban hành kèm theo Thông tư số 107/2017/TT-BTC)</div>
                  </td>
                </tr>
              </table>

              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <div style="width: 25%;"></div>
                <div class="text-center" style="width: 50%;">
                  <h2 style="margin-bottom:2px; margin-top:0; font-size:16pt;">PHIẾU CHI</h2>
                  <i>Ngày <input type="text" id="pc_ngay" class="dot-input text-center auto-d" style="width:25px;"> tháng <input type="text" id="pc_thang" class="dot-input text-center auto-m" style="width:25px;"> năm <input type="text" id="pc_nam" class="dot-input text-center auto-y" style="width:40px;"></i><br>
                  Số: <input type="text" id="pc_sophieu" class="dot-input text-center bold" style="width:140px;" readonly>
                </div>
                <div class="text-right" style="width: 25%; line-height: 1.0;">
                  Quyển số: <input type="text" id="pc_quyen" class="dot-input text-center" style="width:60px;" value="1"><br>
                  Nợ: <input type="text" id="pc_no" class="dot-input" style="width:60px;"><br>
                  Có: <input type="text" id="pc_co" class="dot-input" style="width:60px;">
                </div>
              </div>

              <div style="line-height: 1.0; margin-bottom: 8px;">
                Họ và tên người nhận tiền: <input type="text" id="pc_tennguoinhan" class="dot-input" style="width:68%; font-weight:bold;" list="dl_names" oninput="syncName('chi')"><br>
                Địa chỉ: <input type="text" id="pc_diachi" class="dot-input" style="width:89%;" list="dl_addresses"><br>
                Nội dung: <input type="text" id="pc_noidung" class="dot-input" style="width:88%;" list="dl_contents"><br>
                Số tiền: <input type="text" inputmode="numeric" id="pc_sotien_so" class="dot-input bold" style="width:65%;" oninput="handleMoneyInput(this, 'chi')"> (loại tiền) <input type="text" id="pc_loaitien" class="dot-input" style="width:80px;" value="VNĐ"><br>
                (viết bằng chữ): <input type="text" id="pc_sotien_chu" class="dot-input" style="width:83%; font-style:italic;" readonly><br>
                Kèm theo: <input type="text" id="pc_kemtheo" class="dot-input" style="width:76%;"> chứng từ gốc.
              </div>

              <table class="footer-table" style="border:none;">
                <tr style="border:none;">
                  <td style="border:none;">THỦ TRƯỞNG ĐƠN VỊ<br><div style="line-height: 0.8;"><small style="font-size:10pt; font-weight:normal;">(Ký, họ tên, đóng dấu)</small><br><br><br><br><br><input type="text" id="pc_ky_thutruong" class="dot-input text-center bold" style="width:80%;" list="dl_ky"></td>
                  <td style="border:none;">KẾ TOÁN TRƯỞNG<br><div style="line-height: 0.8;"><small style="font-size:10pt; font-weight:normal;">(Ký, họ tên)</small><br><br><br><br><br><input type="text" id="pc_ky_ketoan" class="dot-input text-center bold" style="width:80%;" list="dl_ky"></td>
                  <td style="border:none;">NGƯỜI LẬP<br><div style="line-height:0.8;"><small style="font-size:10pt; font-weight:normal;">(Ký, họ tên)</small><br><br><br><br><br><input type="text" id="pc_ky_nguoilap" class="dot-input text-center bold" style="width:80%;" list="dl_ky"></td>
                </tr>
              </table>

              <div style="margin-top: 10px; margin-bottom: 5px; color:#555;"></div>

              <div style="line-height: 0.8; margin-bottom: 8px;">
                Đã nhận đủ số tiền: - Bằng số: <input type="text" id="pc_danhan_so" class="dot-input bold" style="width:300px;" readonly><br>
                - Bằng chữ: <input type="text" id="pc_danhan_chu" class="dot-input" style="width:85%; font-style:italic;" readonly>
              </div>

              <div style="display:flex; justify-content:space-between; font-weight:bold;">
                <div class="text-center" style="width:40%; padding-top:20px;">
                  THỦ QUỸ<br><small style="font-size:10pt; font-weight:normal;">(Ký, họ tên)</small><br><br><br>
                  <input type="text" id="pc_ky_thuquy" class="dot-input text-center bold" style="width:80%;" list="dl_ky">
                </div>
                <div class="text-center" style="width:50%;">
                  <i style="font-weight:normal;">Ngày <input type="text" id="pc_ngay2" class="dot-input text-center auto-d" style="width:22px;"> tháng <input type="text" id="pc_thang2" class="dot-input text-center auto-m" style="width:22px;"> năm <input type="text" id="pc_nam2" class="dot-input text-center auto-y" style="width:40px;"></i><br>
                  NGƯỜI NHẬN TIỀN<br><small style="font-size:10pt; font-weight:normal;">(Ký, họ tên)</small><br><br><br>
                  <input type="text" id="pc_ky_nguoinhan" class="dot-input text-center bold" style="width:80%;" readonly>
                </div>
              </div>
              
              <div style="line-height: 0.8; margin-top: 8px;">
                + Tỷ giá ngoại tệ: <input type="text" id="pc_tygia" class="dot-input" style="width:40%;"><br>
                + Số tiền quy đổi: <input type="text" id="pc_quydoi" class="dot-input" style="width:40%;">
              </div>
            </div>
            <div id="print-clone-area-chi" class="print-clone-area"></div>
          </div>
          <div class="text-center btn-print" style="margin-top:30px; border-top: 1px solid #e2e8f0; padding-top:25px;">
            <p id="gsheet-status-chi" style="font-style:italic; display:none; margin-bottom:10px; font-weight:bold; color:#059669;"></p>
            <div style="display: flex; justify-content: center; align-items: center; gap: 15px;">
                <select id="print-format-chi" style="padding:12px; font-size:15px; border-radius:8px; border: 1px solid #cbd5e1; cursor: pointer; outline:none;">
                    <option value="A5">📄 In 1 bản (Khổ A5 ngang)</option>
                    <option value="A4">📄 In 2 bản (Khổ A4 dọc)</option>
                </select>
                <button onclick="savePrintAndReset()" class="btn-modern btn-save">💾 LƯU TRỮ VÀ IN</button>
                <button onclick="clearData()" class="btn-modern btn-clear">🔄 LÀM MỚI TỜ KHAI</button>
            </div>
          </div>
        </div>

        <div id="form-dexuat" class="form-container form-doc">
          <div id="print-area-dexuat">
            <div class="c40-wrapper" id="c40-original-dexuat">
              <table style="width: 100%; margin-bottom: 20px; border:none;">
                <tr style="border:none;">
                  <td style="width: 40%; vertical-align: top; text-align: center; border:none;">
                    <input type="text" id="dx_donvi_1" class="header-input" value="LIÊN ĐOÀN TAEKWONDO"><br>
                    <input type="text" id="dx_donvi_2" class="header-input" value="VIỆT NAM"><br>
                    <small style="color:#fff; user-select:none;">Mã: <input type="text" id="dx_sophieu" style="border:none; outline:none; color:#fff; width:60px;" readonly></small>
                  </td>
                  <td class="text-center" style="vertical-align: top; font-weight: bold; width: 60%; border:none;">
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>
                    Độc lập – Tự do – Hạnh phúc<br><br>
                    <i style="font-weight: normal;">
                      <input type="text" id="dx_diadiem" class="dot-input text-right" style="width:130px;" list="dl_diadiem" value="TP. Hồ Chí Minh" oninput="syncDx(this.value, 'diadiem')">, ngày <input type="text" id="dx_ngay" class="dot-input text-center auto-d" style="width:25px;" oninput="syncDx(this.value, 'ngay')"> tháng <input type="text" id="dx_thang" class="dot-input text-center auto-m" style="width:25px;" oninput="syncDx(this.value, 'thang')"> năm <input type="text" id="dx_nam" class="dot-input text-center auto-y" style="width:40px;" oninput="syncDx(this.value, 'nam')">
                    </i>
                  </td>
                </tr>
              </table>

              <div class="text-center" style="margin-bottom: 25px;">
                <h2 style="margin-bottom:0; margin-top:0; font-size:18pt;">ĐƠN ĐỀ XUẤT</h2>
              </div>

              <div style="line-height: 1.5; margin-bottom: 15px;">
                <span class="bold">Kính Gửi:</span> <input type="text" id="dx_kinhgui" class="dot-input bold" style="width:85%;" list="dl_kinhgui" value="Liên Đoàn Taekwondo Việt Nam"><br>
                <input type="text" id="dx_donvi_dexuat" class="dot-input" style="width:100%;" value="Văn phòng Liên Đoàn Taekwondo Việt Nam đề xuất.">
              </div>

              <table id="dx_table">
                  <thead>
                      <tr>
                          <th style="width: 8%;">STT</th>
                          <th style="width: 50%;">Nội dung</th>
                          <th style="width: 17%;">Số lượng</th>
                          <th style="width: 25%;">Ghi chú</th>
                      </tr>
                  </thead>
                  <tbody>
                  </tbody>
              </table>

              <div class="no-print" style="margin-bottom: 20px;">
                  <button onclick="addDxRow()" class="btn-mini" style="background:#d1fae5; color:#059669; border: 1px solid #34d399;">+ Thêm dòng</button>
                  <button onclick="removeDxRow()" class="btn-mini" style="background:#fee2e2; color:#ef4444; border: 1px solid #fca5a5;">- Xóa dòng</button>
              </div>

              <div style="line-height: 1.8; margin-bottom: 10px;">
                Lí do: <input type="text" id="dx_lydo" class="dot-input" style="width:90%;" list="dl_lydo"><br>
              </div>

              <div style="display:flex; justify-content:space-between; font-weight:bold; margin-top: 30px;">
                <div style="width:40%;"></div>
                <div class="text-center" style="width:60%;">
                  <i style="font-weight:normal;">
                    <input type="text" id="dx_diadiem_ky" class="dot-input text-right" style="width:130px;" list="dl_diadiem" value="TP. Hồ Chí Minh" oninput="syncDx(this.value, 'diadiem')">, ngày <input type="text" id="dx_ngay_ky" class="dot-input text-center auto-d" style="width:20px;" oninput="syncDx(this.value, 'ngay')"> tháng <input type="text" id="dx_thang_ky" class="dot-input text-center auto-m" style="width:20px;" oninput="syncDx(this.value, 'thang')"> năm <input type="text" id="dx_nam_ky" class="dot-input text-center auto-y" style="width:40px;" oninput="syncDx(this.value, 'nam')">
                  </i><br>
                  Người Đề Xuất<br><br><br><br><br>
                  <input type="text" id="dx_ky_nguoilap" class="dot-input text-center bold" style="width:80%;" list="dl_ky">
                </div>
              </div>
            </div>
            <div id="print-clone-area-dexuat" class="print-clone-area"></div>
          </div>
          <div class="text-center btn-print" style="margin-top:30px; border-top: 1px solid #e2e8f0; padding-top:25px;">
            <p id="gsheet-status-dexuat" style="font-style:italic; display:none; margin-bottom:10px; font-weight:bold; color:#059669;"></p>
            <div style="display: flex; justify-content: center; align-items: center; gap: 15px;">
                <select id="print-format-dexuat" style="padding:12px; font-size:15px; border-radius:8px; border: 1px solid #cbd5e1; cursor: pointer; outline:none; display:none;">
                    <option value="A4">📄 In 1 bản (Khổ A4)</option>
                </select>
                <button onclick="savePrintAndReset()" class="btn-modern btn-save">💾 LƯU TRỮ VÀ IN A4</button>
                <button onclick="clearData()" class="btn-modern btn-clear">🔄 LÀM MỚI ĐƠN</button>
            </div>
          </div>
        </div>

        <div id="form-thanhtoan" class="form-container form-doc">
          <div id="print-area-thanhtoan">
            <div class="c40-wrapper" id="c40-original-thanhtoan">
              <table style="width: 100%; margin-bottom: 20px; border:none;">
                <tr style="border:none;">
                  <td style="width: 40%; vertical-align: top; text-align: center; border:none;">
                    <input type="text" id="tt_donvi_1" class="header-input" value="LIÊN ĐOÀN TAEKWONDO"><br>
                    <input type="text" id="tt_donvi_2" class="header-input" value="VIỆT NAM"><br>
                    <small style="color:#fff; user-select:none;">Mã: <input type="text" id="tt_sophieu" style="border:none; outline:none; color:#fff; width:60px;" readonly></small>
                  </td>
                  <td class="text-center" style="vertical-align: top; font-weight: bold; width: 60%; border:none;">
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>
                    <span style="text-decoration: underline;">Độc lập – Tự do – Hạnh phúc</span><br><br>
                    <i style="font-weight: normal;">
                      <input type="text" id="tt_diadiem" class="dot-input text-right" style="width:120px;" list="dl_diadiem" value="TP. Hồ Chí Minh">, ngày <input type="text" id="tt_ngay" class="dot-input text-center auto-d" style="width:25px;"> tháng <input type="text" id="tt_thang" class="dot-input text-center auto-m" style="width:25px;"> năm <input type="text" id="tt_nam" class="dot-input text-center auto-y" style="width:40px;">
                    </i>
                  </td>
                </tr>
              </table>

              <div class="text-center" style="margin-bottom: 20px;">
                <h2 style="margin-bottom:5px; margin-top:0; font-size:18pt;">GIẤY ĐỀ NGHỊ</h2>
                Về việc <input type="text" id="tt_veviec" class="dot-input text-center" style="width:60%;" list="dl_contents" oninput="document.getElementById('tt_txt_veviec').innerText = this.value"><br>
                <span class="bold">Kính gửi:</span> <input type="text" id="tt_kinhgui" class="dot-input bold" style="width:60%;" list="dl_kinhgui" value="Ban thường vụ Liên Đoàn Taekwondo Việt Nam" oninput="document.getElementById('tt_txt_kinhgui').innerText = this.value">
              </div>

              <div style="line-height: 1.8; margin-bottom: 10px; padding-left: 30px;">
                <table style="width:100%; margin-bottom:5px; border:none; font-family:'Times New Roman', Times, serif; font-size:14pt;">
                    <tr style="border:none;">
                        <td style="width:140px; border:none; padding:0;">Người đề nghị</td>
                        <td style="border:none; padding:0;">: <input type="text" id="tt_nguoidenghi" class="dot-input" style="width:80%;" list="dl_names" oninput="document.getElementById('tt_ky_ten').value = this.value"></td>
                    </tr>
                    <tr style="border:none;">
                        <td style="border:none; padding:0;">Bộ phận</td>
                        <td style="border:none; padding:0;">: <input type="text" id="tt_bophan" class="dot-input" style="width:80%;" list="dl_addresses"></td>
                    </tr>
                </table>
                
                Kính trình <span id="tt_txt_kinhgui" style="text-transform: lowercase;">ban thường vụ liên đoàn taekwondo việt nam</span> thanh toán <span id="tt_txt_veviec">...................................................</span><br>
                Số lượng:<br>
                
                <div id="tt_items_container"></div>
                
                <div class="no-print" style="margin-bottom: 10px;">
                    <button onclick="addTtRow()" class="btn-mini" style="background:#d1fae5; color:#059669; border: 1px solid #34d399;">+ Thêm dòng</button>
                    <button onclick="removeTtRow()" class="btn-mini" style="background:#fee2e2; color:#ef4444; border: 1px solid #fca5a5;">- Xóa dòng</button>
                </div>

                Số tiền: <input type="text" inputmode="numeric" id="tt_sotien_so" class="dot-input bold" style="width:150px;" oninput="handleMoneyInput(this, 'thanhtoan')">đ<br>
                <span class="bold">(<input type="text" id="tt_sotien_chu" class="dot-input bold" style="width:80%;" readonly>)</span><br>
                Số tài khoản: <input type="text" id="tt_stk" class="dot-input" style="width:80%;"><br>
                Rất mong được chấp thuận.
              </div>

              <div style="display:flex; justify-content:space-between; font-weight:bold; margin-top: 30px;">
                <div style="width:50%;"></div>
                <div class="text-center" style="width:50%;">
                  NGƯỜI ĐỀ NGHỊ<br><br><br><br><br>
                  <input type="text" id="tt_ky_ten" class="dot-input text-center bold" style="width:80%;" readonly>
                </div>
              </div>
            </div>
            <div id="print-clone-area-thanhtoan" class="print-clone-area"></div>
          </div>
          <div class="text-center btn-print" style="margin-top:30px; border-top: 1px solid #e2e8f0; padding-top:25px;">
            <p id="gsheet-status-thanhtoan" style="font-style:italic; display:none; margin-bottom:10px; font-weight:bold; color:#059669;"></p>
            <div style="display: flex; justify-content: center; align-items: center; gap: 15px;">
                <select id="print-format-thanhtoan" style="padding:12px; font-size:15px; border-radius:8px; border: 1px solid #cbd5e1; cursor: pointer; outline:none; display:none;">
                    <option value="A4">📄 In 1 bản (Khổ A4)</option>
                </select>
                <button onclick="savePrintAndReset()" class="btn-modern btn-save">💾 LƯU TRỮ VÀ IN A4</button>
                <button onclick="clearData()" class="btn-modern btn-clear">🔄 LÀM MỚI ĐƠN</button>
            </div>
          </div>
        </div>

        <div id="form-bangiao" class="form-container form-doc">
          <div id="print-area-bangiao">
            <div class="c40-wrapper" id="c40-original-bangiao">
              <div class="text-center bold" style="margin-bottom: 20px;">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>
                <span style="text-decoration: underline;">Độc lập - Tự do - Hạnh phúc</span><br>
                <small style="color:white;user-select:none">Mã: <input type="text" id="bg_sophieu" style="border:none; outline:none; color:white; width:60px;" readonly></small>
              </div>
              <div class="text-right" style="margin-bottom: 30px;">
                <input type="text" id="bg_diadiem" class="dot-input text-right" style="width:150px;" list="dl_diadiem" value="TP. Hồ Chí Minh">, 
                ngày <input type="text" id="bg_ngay" class="dot-input text-center auto-d" style="width:25px;"> 
                tháng <input type="text" id="bg_thang" class="dot-input text-center auto-m" style="width:25px;"> 
                năm <input type="text" id="bg_nam" class="dot-input text-center auto-y" style="width:40px;">
              </div>
              
              <div class="text-center" style="margin-bottom: 30px;">
                <h2 style="margin-bottom:0; margin-top:0; font-size:18pt;">BIÊN BẢN BÀN GIAO HỒ SƠ, TÀI LIỆU</h2>
              </div>

              <div style="line-height: 1.8; margin-bottom: 15px;">
                <span class="bold">Bên giao:</span><br>
                Họ tên: <input type="text" id="bg_bengiao" class="dot-input" style="width:85%;" list="dl_names" oninput="document.getElementById('bg_ky_giao').value = this.value"><br>
                <span class="bold">Bên nhận:</span><br>
                Họ tên: <input type="text" id="bg_bennhan" class="dot-input" style="width:85%;" list="dl_names" oninput="document.getElementById('bg_ky_nhan').value = this.value"><br>
              </div>

              <p class="bold">Chi tiết tài liệu bàn giao:</p>
              <table id="bg_table">
                  <thead>
                      <tr>
                          <th style="width: 10%;">STT</th>
                          <th style="width: 90%;">Tên tài liệu</th>
                      </tr>
                  </thead>
                  <tbody>
                  </tbody>
              </table>

              <div class="no-print" style="margin-bottom: 20px;">
                  <button onclick="addBgRow()" class="btn-mini" style="background:#d1fae5; color:#059669; border: 1px solid #34d399;">+ Thêm dòng</button>
                  <button onclick="removeBgRow()" class="btn-mini" style="background:#fee2e2; color:#ef4444; border: 1px solid #fca5a5;">- Xóa dòng</button>
              </div>

              <div style="line-height: 1.2; margin-bottom: 14px; text-align: justify; text-indent: 30px;">
                Người bàn giao hồ sơ tài liệu nêu trên được bàn giao đầy đủ, chính xác.Người nhận tài liệu xác nhận  toàn bộ hồ sơ tài liệu nhận đủ theo bản chi tiết. Biên bản lập thành hai bản, mỗi bên giữ một bản.                           
                </div>
              <div style="display:flex; justify-content:space-between; font-weight:bold; margin-top: 40px;">
                <div class="text-center" style="width:50%;">
                  ĐẠI DIỆN BÊN NHẬN BÀN GIAO<br><br><br><br>
                  <input type="text" id="bg_ky_nhan" class="dot-input text-center bold" style="width:80%;" readonly>
                </div>
                <div class="text-center" style="width:50%;">
                  ĐẠI DIỆN BÊN BÀN GIAO<br><br><br><br>
                  <input type="text" id="bg_ky_giao" class="dot-input text-center bold" style="width:80%;" readonly>
                </div>
              </div>
            </div>
            <div id="print-clone-area-bangiao" class="print-clone-area"></div>
          </div>
          <div class="text-center btn-print" style="margin-top:30px; border-top: 1px solid #e2e8f0; padding-top:25px;">
            <p id="gsheet-status-bangiao" style="font-style:italic; display:none; margin-bottom:10px; font-weight:bold; color:#059669;"></p>
            <div style="display: flex; justify-content: center; align-items: center; gap: 15px;">
                <select id="print-format-bangiao" style="padding:12px; font-size:15px; border-radius:8px; border: 1px solid #cbd5e1; cursor: pointer; outline:none;">
                    <option value="A5">📄 In 1 bản (Khổ A5 ngang)</option>
                    <option value="A4">📄 In 2 bản (Khổ A4 dọc)</option>
                </select>
                <button onclick="savePrintAndReset()" class="btn-modern btn-save">💾 LƯU TRỮ VÀ IN</button>
                <button onclick="clearData()" class="btn-modern btn-clear">🔄 LÀM MỚI BIÊN BẢN</button>
            </div>
          </div>
        </div>

        <div id="form-xuat" class="form-container form-doc">
          <div id="print-area-xuat">
            <div class="c40-wrapper" id="c40-original-xuat">
              <div style="margin-bottom: 20px;">
                <div class="bold">Đơn vị: <input type="text" id="xk_donvi" class="dot-input" style="width:420px;" value="Liên đoàn Taekwondo TP. Hồ Chí Minh"></div>
                <div class="bold">Bộ phận: <input type="text" id="xk_bophan_dv" class="dot-input" style="width:300px;" value="Văn Phòng"></div>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                <div style="width: 20%;"></div>
                <div class="text-center" style="width: 60%;">
                  <h2 style="margin-bottom:5px; margin-top:0; font-size: 16pt;">PHIẾU XUẤT KHO</h2>
                  <i>Ngày <input type="text" id="xk_ngay" class="dot-input text-center auto-d" style="width:22px;"> tháng <input type="text" id="xk_thang" class="dot-input text-center auto-m" style="width:22px;"> năm <input type="text" id="xk_nam" class="dot-input text-center auto-y" style="width:40px;"></i><br>
                  Số: <input type="text" id="xk_sophieu" class="dot-input text-center bold" style="width:160px;" readonly>
                </div>
                <div class="text-right" style="width: 20%; line-height: 1.0;">
                  Nợ <input type="text" id="xk_no" class="dot-input" style="width:80px;"><br>
                  Có <input type="text" id="xk_co" class="dot-input" style="width:80px;">
                </div>
              </div>

              <div style="line-height: 1; margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; gap: 10px;">
                  <div style="flex: 1; display: flex; align-items: center; white-space: nowrap;">
                    - Họ và tên người nhận hàng: <input type="text" id="xk_tennguoinhan" class="dot-input" style="flex: 1; margin-left: 5px;" list="dl_names" oninput="document.getElementById('xk_ky_nhan').value = this.value">
                  </div>
                  <div style="width: 350px; display: flex; align-items: center; white-space: nowrap;">
                    Địa chỉ (bộ phận): <input type="text" id="xk_diachi_nhan" class="dot-input" style="flex: 1; margin-left: 5px;" list="dl_addresses">
                  </div>
                </div>
                
                <div style="display: flex; align-items: center; margin-top: 5px;">
                  <span style="white-space: nowrap;">- Lý do xuất kho:</span> 
                  <input type="text" id="xk_lydo" class="dot-input" style="flex: 1; margin-left: 5px;" list="dl_contents">
                </div>
                
                <div style="display: flex; justify-content: space-between; gap: 10px; margin-top: 5px;">
                  <div style="flex: 1; display: flex; align-items: center; white-space: nowrap;">
                    - Xuất tại kho (ngăn lô): <input type="text" id="xk_kho" class="dot-input" style="flex: 1; margin-left: 2px;" list="dl_addresses">
                  </div>
                  <div style="width: 300px; display: flex; align-items: center; white-space: nowrap;">
                    Địa điểm: <input type="text" id="xk_diadiem_kho" class="dot-input" style="flex: 1; margin-left: 20px;" list="dl_diadiem">
                  </div>
                </div>
              </div>

              <datalist id="dl_xk_nd_table"></datalist>

              <table id="xk_table">
                <thead>
                  <tr>
                    <th style="width: 8%;">STT</th>
                    <th style="width: 50%;">Tên, nhãn hiệu, quy cách,<br>phẩm chất vật tư, dụng cụ<br>sản phẩm, hàng hóa</th>
                    <th style="width: 10%;">Số<br>lượng</th>
                    <th style="width: 50%;">Ghi Chú<br>Yêu cầu</th>
                  </tr>
                </thead>
                <tbody>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" class="bold text-center">Cộng</td>
                    <td><input type="text" id="xk_tong_sl" class="dx-input text-center bold" readonly></td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>

              <div class="no-print" style="margin-bottom: 20px;">
                  <button onclick="addXkRow()" class="btn-mini" style="background:#d1fae5; color:#059669; border: 1px solid #34d399;">+ Thêm dòng</button>
                  <button onclick="removeXkRow()" class="btn-mini" style="background:#fee2e2; color:#ef4444; border: 1px solid #fca5a5;">- Xóa dòng</button>
              </div>

              <div style="line-height: 1.8; margin-bottom: 20px;">
                Người nhận cam kết nhận đủ số lượng theo giấy xuất kho, hàng hóa sử dụng bình thường không hư hỏng. Phiếu Xuất Kho này được lập thành 2 bản mỗi bên giữ 1 bản<br>
                - Số chứng từ gốc kèm theo: <input type="text" id="xk_chungtu" class="dot-input" style="width:70%;">
              </div>

              <div class="text-right" style="margin-bottom: 10px;">
                <i style="font-weight:normal;">Ngày <input type="text" class="dot-input text-center auto-d" style="width:25px;"> tháng <input type="text" class="dot-input text-center auto-m" style="width:25px;"> năm <input type="text" class="dot-input text-center auto-y" style="width:40px;"></i>
              </div>

              <table class="footer-table" style="width:100%; text-align:center; border:none;">
                <tr style="border:none;">
                  <td style="width:33%; border:none;">Người lập phiếu<br><div style="line-height: 1.0;"><small style="font-size:12pt; font-weight:normal;">(Ký, họ tên)</small><br><br><br><br><input type="text" id="xk_ky_lap" class="dot-input text-center bold" style="width:80%;" list="dl_ky"></td>
                  <td style="width:33%; border:none;">Người nhận hàng<br><div style="line-height: 1.0;"><small style="font-size:12pt; font-weight:normal;">(Ký, họ tên)</small><br><br><br><br><input type="text" id="xk_ky_nhan" class="dot-input text-center bold" style="width:80%;" readonly></td>
                  <td style="width:34%; border:none;">Thủ kho<br><div style="line-height: 1.0;"><small style="font-size:12pt; font-weight:normal;">(Ký, họ tên)</small><br><br><br><br><input type="text" id="xk_ky_kho" class="dot-input text-center bold" style="width:80%;" list="dl_ky"></td>
                </tr>
              </table>
            </div>
          </div>
          <div class="text-center btn-print" style="margin-top:30px; border-top: 1px solid #e2e8f0; padding-top:25px;">
            <p id="gsheet-status-xuat" style="font-style:italic; display:none; margin-bottom:10px; font-weight:bold; color:#059669;"></p>
            <div style="display: flex; justify-content: center; align-items: center; gap: 15px;">
                <select id="print-format-xuat" style="padding:12px; font-size:15px; border-radius:8px; border: 1px solid #cbd5e1; cursor: pointer; outline:none; display:none;">
                    <option value="A4">📄 In 1 bản (Khổ A4)</option>
                </select>
                <button onclick="saveXuatKho()" class="btn-modern btn-save" style="background:#f59e0b; box-shadow: 0 4px 10px rgba(245,158,11,0.3);">💾 IN VÀ GỬI YÊU CẦU NHẬP KHO</button>
                <button onclick="clearData()" class="btn-modern btn-clear">🔄 LÀM MỚI PHIẾU</button>
            </div>
          </div>
        </div>

        <div id="form-nhap" class="form-container">
            <h2 style="color:#0f172a; border-bottom:2px solid #e2e8f0; padding-bottom:10px; margin-top:0;">📥 QUẢN LÝ NHẬP KHO</h2>
            
            <div style="margin-bottom: 20px;">
                <button onclick="toggleNhapView('list')" class="archive-tab active" id="btn-nhap-list">⏳ Chờ xác nhận từ Xuất kho</button>
                <button onclick="toggleNhapView('doc')" class="archive-tab" id="btn-nhap-doc" style="background:#10b981; color:white;">+ Lập Phiếu Nhập Kho Mới</button>
            </div>

            <div id="nhap-view-list">
                <div id="nhap-pending-content"></div>
            </div>

            <div id="nhap-view-doc" style="display:none;" class="form-doc">
                <div id="print-area-nhap">
                    <div class="c40-wrapper" id="c40-original-nhap">
                      <div style="margin-bottom: 20px;">
                        <div class="bold">Đơn vị: <input type="text" id="nk_donvi" class="dot-input" style="width:420px;" value="Liên đoàn Taekwondo TP. Hồ Chí Minh"></div>
                        <div class="bold">Bộ phận: <input type="text" id="nk_bophan_dv" class="dot-input" style="width:300px;" value="Văn Phòng"></div>
                      </div>

                      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                        <div style="width: 20%;"></div>
                        <div class="text-center" style="width: 60%;">
                          <h2 style="margin-bottom:5px; margin-top:0; font-size: 18pt;">PHIẾU NHẬP KHO</h2>
                          <i>Ngày <input type="text" id="nk_ngay" class="dot-input text-center auto-d" style="width:25px;"> tháng <input type="text" id="nk_thang" class="dot-input text-center auto-m" style="width:25px;"> năm <input type="text" id="nk_nam" class="dot-input text-center auto-y" style="width:40px;"></i><br>
                          Số: <input type="text" id="nk_sophieu" class="dot-input text-center bold" style="width:160px;" readonly>
                        </div>
                        <div class="text-right" style="width: 20%; line-height: 1.5;">
                          Nợ <input type="text" class="dot-input" style="width:80px;"><br>
                          Có <input type="text" class="dot-input" style="width:80px;">
                        </div>
                      </div>

                      <div style="line-height: 2; margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; gap: 10px;">
                          <div style="flex: 1; display: flex; align-items: center; white-space: nowrap;">
                            - Họ và tên người giao hàng: <input type="text" id="nk_tennguoinhan" class="dot-input" style="flex: 1; margin-left: 5px;" list="dl_names" oninput="document.getElementById('nk_ky_nhan').value = this.value">
                          </div>
                          <div style="width: 350px; display: flex; align-items: center; white-space: nowrap;">
                            Địa chỉ (bộ phận): <input type="text" class="dot-input" style="flex: 1; margin-left: 5px;" list="dl_addresses">
                          </div>
                        </div>
                        
                        <div style="display: flex; align-items: center; margin-top: 5px;">
                          <span style="white-space: nowrap;">- Lý do nhập kho:</span> 
                          <input type="text" id="nk_lydo" class="dot-input" style="flex: 1; margin-left: 5px;" list="dl_contents">
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; gap: 10px; margin-top: 5px;">
                          <div style="flex: 1; display: flex; align-items: center; white-space: nowrap;">
                            - Nhập tại kho (ngăn lô): <input type="text" class="dot-input" style="flex: 1; margin-left: 5px;" list="dl_addresses">
                          </div>
                          <div style="width: 350px; display: flex; align-items: center; white-space: nowrap;">
                            Địa điểm: <input type="text" class="dot-input" style="flex: 1; margin-left: 5px;" list="dl_diadiem">
                          </div>
                        </div>
                      </div>

                      <table id="nk_table">
                        <thead>
                          <tr>
                            <th style="width: 8%;">STT</th>
                            <th style="width: 50%;">Tên, nhãn hiệu, quy cách,<br>phẩm chất vật tư, dụng cụ<br>sản phẩm, hàng hóa</th>
                            <th style="width: 15%;">Số<br>lượng</th>
                            <th style="width: 27%;">Ghi Chú<br>Yêu cầu</th>
                          </tr>
                        </thead>
                        <tbody>
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colspan="2" class="bold text-center">Cộng</td>
                            <td><input type="text" id="nk_tong_sl" class="dx-input text-center bold" readonly></td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>

                      <div class="no-print" style="margin-bottom: 20px;">
                          <button onclick="addNkRow()" class="btn-mini" style="background:#d1fae5; color:#059669; border: 1px solid #34d399;">+ Thêm dòng</button>
                          <button onclick="removeNkRow()" class="btn-mini" style="background:#fee2e2; color:#ef4444; border: 1px solid #fca5a5;">- Xóa dòng</button>
                      </div>

                      <div style="line-height: 1.8; margin-bottom: 20px;">
                        Người nhận cam kết nhận đủ số lượng theo giấy nhập kho, hàng hóa sử dụng bình thường không hư hỏng. Phiếu Nhập Kho này được lập thành 2 bản mỗi bên giữ 1 bản<br>
                        - Số chứng từ gốc kèm theo: <input type="text" class="dot-input" style="width:70%;">
                      </div>

                      <div class="text-right" style="margin-bottom: 10px;">
                        <i style="font-weight:normal;">Ngày <input type="text" class="dot-input text-center auto-d" style="width:25px;"> tháng <input type="text" class="dot-input text-center auto-m" style="width:25px;"> năm <input type="text" class="dot-input text-center auto-y" style="width:40px;"></i>
                      </div>

                      <table class="footer-table" style="width:100%; text-align:center; border:none;">
                        <tr style="border:none;">
                          <td style="width:33%; border:none;">Người lập phiếu<br><small style="font-size:12pt; font-weight:normal;">(Ký, họ tên)</small><br><br><br><br><br><input type="text" class="dot-input text-center bold" style="width:80%;" list="dl_ky"></td>
                          <td style="width:33%; border:none;">Người giao hàng<br><small style="font-size:12pt; font-weight:normal;">(Ký, họ tên)</small><br><br><br><br><br><input type="text" id="nk_ky_nhan" class="dot-input text-center bold" style="width:80%;" readonly></td>
                          <td style="width:34%; border:none;">Thủ kho<br><small style="font-size:12pt; font-weight:normal;">(Ký, họ tên)</small><br><br><br><br><br><input type="text" class="dot-input text-center bold" style="width:80%;" list="dl_ky"></td>
                        </tr>
                      </table>
                    </div>
                </div>
                <div class="text-center btn-print" style="margin-top:30px; border-top: 1px solid #e2e8f0; padding-top:25px;">
                    <div id="nhap-buttons-normal" style="display: flex; justify-content: center; align-items: center; gap: 15px;">
                        <select id="print-format-nhap" style="padding:12px; font-size:15px; border-radius:8px; border: 1px solid #cbd5e1; cursor: pointer; outline:none; display:none;">
                            <option value="A4">📄 In 1 bản (Khổ A4)</option>
                        </select>
                        <button onclick="saveNhapKhoMoi()" class="btn-modern btn-save">💾 LƯU TRỮ VÀ CỘNG KHO TỔNG</button>
                        <button onclick="clearData()" class="btn-modern btn-clear">🔄 LÀM MỚI PHIẾU</button>
                    </div>
                    <div id="nhap-buttons-confirm" style="display: none; justify-content: center; align-items: center; gap: 15px;">
                        <button id="btn-confirm-nhap-final" class="btn-modern btn-save" style="background:#10b981; padding: 12px 40px; font-size: 16px;">✔️ XÁC NHẬN NHẬP KHO</button>
                    </div>
                </div>
            </div>
        </div>

        <div id="form-ton" class="form-container" style="max-width: 100%; width: 1000px; padding: 20px;">
            <h2 style="margin-top: 0; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">📦 QUẢN LÝ HÀNG TỒN (KIỂM KHO)</h2>

            <div id="ton-add-bar" style="display: flex; gap: 10px; margin-bottom: 15px; align-items: center;">
                <select id="ton_loai_timkiem" style="padding: 10px; border: 1px solid #cbd5e1; border-radius: 5px; outline:none; background:white;">
                    <option value="name">Tìm sản phẩm</option>
                </select>
                <input type="text" id="ton_tk_sp" list="dl_xk_nd_table" placeholder="Bấm vào đây để chọn hoặc nhập tên sản phẩm..." style="flex: 1; padding: 10px; border: 1px solid #cbd5e1; border-radius: 5px; outline:none;">
                <button onclick="addNewTonRow()" class="btn-modern" style="background: #3b82f6; color: white; padding: 10px 15px; font-size:14px;">+ Thêm</button>
            </div>

            <div style="display: flex; gap: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 15px; font-size: 14px; font-weight: bold; color: #64748b;">
                <div style="cursor: pointer; color: #3b82f6; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">
                    Tất cả <span style="background: #06b6d4; color: white; padding: 2px 6px; border-radius: 10px; font-size: 12px;" id="badge-all">0</span>
                </div>
                <div style="cursor: pointer;">✓ Khớp <span style="background: #22c55e; color: white; padding: 2px 6px; border-radius: 10px; font-size: 12px;">0</span></div>
                <div style="cursor: pointer;">+ Thừa <span style="background: #f97316; color: white; padding: 2px 6px; border-radius: 10px; font-size: 12px;">0</span></div>
                <div style="cursor: pointer;">- Thiếu <span style="background: #ef4444; color: white; padding: 2px 6px; border-radius: 10px; font-size: 12px;">0</span></div>
            </div>

            <table class="data-table" id="inventory-table" style="width: 100%; text-align: center; border-collapse: collapse;">
    <thead>
        <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
            <th style="text-align: center; width: 35%; padding: 12px; border: 1px solid #e2e8f0;">SẢN PHẨM</th>
            <th style="text-align: center; padding: 12px; border: 1px solid #e2e8f0;">TỔNG SỐ LƯỢNG</th>
            <th style="text-align: center; padding: 12px; border: 1px solid #e2e8f0;">🚚 ĐANG XUẤT KHO</th>
            <th style="text-align: center; padding: 12px; border: 1px solid #e2e8f0;">🏠 TỒN</th>
            <th style="text-align: center; padding: 12px; border: 1px solid #e2e8f0;">📦 HÀNG THIẾU</th>
            <th style="text-align: center; padding: 12px; border: 1px solid #e2e8f0;">THỰC TẾ</th>
            <th style="text-align: center; padding: 12px; border: 1px solid #e2e8f0;">SL LỆCH</th>
            <th style="width:5%; border: 1px solid #e2e8f0;"></th>
        </tr>
    </thead>
    <tbody>
    </tbody>
</table>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px; color: #64748b; font-size: 14px;">
                <div id="ton-pagination">0 - 0 / 0 sản phẩm</div>
                <div style="display:flex; gap:10px; color:#3b82f6; cursor:pointer;">
                    <span>❮</span> <span style="font-weight:bold;">1</span> <span>❯</span>
                </div>
            </div>
            
            <div class="text-center" style="margin-top:30px;">
                <button onclick="alert('Tính năng đồng bộ kiểm kho Google Sheets đang phát triển!')" class="btn-modern btn-save">💾 LƯU PHIẾU KIỂM KHO</button>
            </div>
        </div>

        <div id="form-thongbao" class="form-container" style="max-width: 100%; width: 950px;">
            <h2 style="color:#0f172a; border-bottom:2px solid #e2e8f0; padding-bottom:10px; margin-top:0;">🔔 DANH SÁCH THÔNG BÁO</h2>
            <div id="thongbao-content"></div>
        </div>

        <div id="form-setting" class="form-container" style="max-width: 100%; width: 950px;">
            <h2 style="color:#0f172a; border-bottom:2px solid #e2e8f0; padding-bottom:10px; margin-top:0;">⚙️ QUẢN LÝ TÀI KHOẢN</h2>
            <div style="background: #f8fafc; padding: 25px; border-radius: 10px; margin-bottom: 30px; border: 1px solid #e2e8f0;">
                <h3 style="margin-top:0; color:#3b82f6;">Thêm Tài Khoản User Phụ</h3>
                <div style="display:flex; gap: 15px; margin-bottom: 15px;">
                    <input id="new_u" placeholder="Tên đăng nhập mới" style="flex:1; padding:12px; border-radius:8px; border:1px solid #cbd5e1; outline:none;">
                    <input id="new_p" type="password" placeholder="Mật khẩu" style="flex:1; padding:12px; border-radius:8px; border:1px solid #cbd5e1; outline:none;">
                </div>
                <p class="bold" style="margin-bottom:10px;">Phân quyền (Tích chọn để cho phép sử dụng):</p>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px;">
                    <label style="cursor:pointer;"><input type="checkbox" class="cb-perm" value="thu"> Phiếu thu</label>
                    <label style="cursor:pointer;"><input type="checkbox" class="cb-perm" value="chi"> Phiếu chi</label>
                    <label style="cursor:pointer;"><input type="checkbox" class="cb-perm" value="dexuat"> Đề xuất</label>
                    <label style="cursor:pointer;"><input type="checkbox" class="cb-perm" value="thanhtoan"> Thanh toán</label>
                    <label style="cursor:pointer;"><input type="checkbox" class="cb-perm" value="bangiao"> Bàn giao</label>
                    <label style="cursor:pointer;"><input type="checkbox" class="cb-perm" value="xuat"> Xuất kho</label>
                    <label style="cursor:pointer;"><input type="checkbox" class="cb-perm" value="nhap"> Nhập kho</label>
                    <label style="cursor:pointer;"><input type="checkbox" class="cb-perm" value="ton"> Tồn kho</label>
                    <label style="cursor:pointer; color:#ef4444; font-weight:bold;"><input type="checkbox" class="cb-perm" value="edit_archive"> Quyền Sửa/Xóa Lưu Trữ</label>
                    <label style="cursor:pointer; color:#f59e0b; font-weight:bold;"><input type="checkbox" class="cb-perm" value="edit_ton"> Quyền Sửa Tồn Kho</label>
                </div>
                <button onclick="addUser()" class="btn-modern btn-save">TẠO TÀI KHOẢN</button>
            </div>

            <h3 style="color:#0f172a;">Danh sách tài khoản hiện có</h3>
            <table class="data-table" id="tbl_users">
                <thead><tr><th width="25%">Tên đăng nhập</th><th width="55%">Quyền hạn được cấp</th><th width="20%" class="text-center">Thao tác</th></tr></thead>
                <tbody></tbody>
            </table>
        </div>

        <div id="form-luutru" class="form-container" style="max-width: 100%; width: 950px;">
            <h2 style="color:#0f172a; border-bottom:2px solid #e2e8f0; padding-bottom:10px; margin-top:0;">🗄️ KHO LƯU TRỮ</h2>
            <div style="margin-bottom: 20px; padding-top:10px;">
                <div class="archive-tab active" id="tab-lt-thu" onclick="viewArchive('thu')">Phiếu thu</div>
                <div class="archive-tab" id="tab-lt-chi" onclick="viewArchive('chi')">Phiếu chi</div>
                <div class="archive-tab" id="tab-lt-dexuat" onclick="viewArchive('dexuat')">Đề xuất</div>
                <div class="archive-tab" id="tab-lt-thanhtoan" onclick="viewArchive('thanhtoan')">Thanh toán</div>
                <div class="archive-tab" id="tab-lt-bangiao" onclick="viewArchive('bangiao')">Bàn giao</div>
                <div class="archive-tab" id="tab-lt-xuat" onclick="viewArchive('xuat')">Xuất kho</div>
                <div class="archive-tab" id="tab-lt-nhap" onclick="viewArchive('nhap')">Nhập kho</div>
            </div>
            <div id="archive-content"></div>
        </div>
      </div>

      <script>
        const scriptURL = '${URL_GS}';
        
        const inputsThu = ['pt_donvi', 'pt_maqhns', 'pt_ngay', 'pt_thang', 'pt_nam', 'pt_sophieu', 'pt_quyen', 'pt_no', 'pt_co', 'pt_tennguoinop', 'pt_diachi', 'pt_noidung', 'pt_sotien_so', 'pt_sotien_chu', 'pt_loaitien', 'pt_kemtheo', 'pt_ky_thutruong', 'pt_ky_ketoan', 'pt_ky_nguoilap', 'pt_ky_thuquy', 'pt_ky_nguoinop', 'pt_danhan_so', 'pt_danhan_chu'];
        const keepsThu = ['pt_donvi', 'pt_quyen', 'pt_ky_thutruong', 'pt_ky_ketoan', 'pt_ky_nguoilap', 'pt_ky_thuquy'];
        
        const inputsChi = ['pc_donvi', 'pc_maqhns', 'pc_ngay', 'pc_thang', 'pc_nam', 'pc_sophieu', 'pc_quyen', 'pc_no', 'pc_co', 'pc_tennguoinhan', 'pc_diachi', 'pc_noidung', 'pc_sotien_so', 'pc_sotien_chu', 'pc_loaitien', 'pc_kemtheo', 'pc_ky_thutruong', 'pc_ky_ketoan', 'pc_ky_nguoilap', 'pc_ky_thuquy', 'pc_ky_nguoinhan', 'pc_danhan_so', 'pc_danhan_chu', 'pc_tygia', 'pc_quydoi'];
        const keepsChi = ['pc_donvi', 'pc_quyen', 'pc_ky_thutruong', 'pc_ky_ketoan', 'pc_ky_nguoilap', 'pc_ky_thuquy'];

        const inputsDexuat = ['dx_donvi_1', 'dx_donvi_2', 'dx_sophieu', 'dx_diadiem', 'dx_ngay', 'dx_thang', 'dx_nam', 'dx_kinhgui', 'dx_kinhgui_phu', 'dx_donvi_dexuat', 'dx_lydo', 'dx_diadiem_ky', 'dx_ngay_ky', 'dx_thang_ky', 'dx_nam_ky', 'dx_ky_nguoilap'];
        const keepsDexuat = ['dx_donvi_1', 'dx_donvi_2', 'dx_diadiem', 'dx_diadiem_ky', 'dx_kinhgui', 'dx_donvi_dexuat', 'dx_ky_nguoilap'];

        const inputsThanhtoan = ['tt_donvi_1', 'tt_donvi_2', 'tt_diadiem', 'tt_ngay', 'tt_thang', 'tt_nam', 'tt_sophieu', 'tt_veviec', 'tt_kinhgui', 'tt_nguoidenghi', 'tt_bophan', 'tt_sotien_so', 'tt_sotien_chu', 'tt_stk'];
        const keepsThanhtoan = ['tt_donvi_1', 'tt_donvi_2', 'tt_diadiem', 'tt_kinhgui'];

        const inputsBangiao = ['bg_diadiem', 'bg_ngay', 'bg_thang', 'bg_nam', 'bg_sophieu', 'bg_bengiao', 'bg_bennhan'];
        const keepsBangiao = ['bg_diadiem'];

        const inputsXuat = ['xk_donvi', 'xk_bophan_dv', 'xk_sophieu', 'xk_ngay', 'xk_thang', 'xk_nam', 'xk_no', 'xk_co', 'xk_tennguoinhan', 'xk_diachi_nhan', 'xk_lydo', 'xk_kho', 'xk_diadiem_kho', 'xk_chungtu', 'xk_ky_lap', 'xk_ky_nhan', 'xk_ky_kho'];
        const keepsXuat = ['xk_donvi', 'xk_bophan_dv', 'xk_kho', 'xk_diadiem_kho', 'xk_ky_lap', 'xk_ky_kho'];

        const inputsNhap = ['nk_donvi', 'nk_bophan_dv', 'nk_sophieu', 'nk_ngay', 'nk_thang', 'nk_nam', 'nk_tennguoinhan', 'nk_lydo'];
        const keepsNhap = ['nk_donvi', 'nk_bophan_dv'];

        let currentActiveForm = 'thu';

        function getSafeJSON(key, defaultVal) {
            try { 
                let val = localStorage.getItem(key); 
                return val ? JSON.parse(val) : defaultVal; 
            } catch(e) { return defaultVal; }
        }

        // BỘ NHỚ GỢI Ý TỰ ĐỘNG LƯU VĨNH VIỄN
        document.addEventListener('focusout', function(e) {
            if (e.target && e.target.tagName === 'INPUT' && e.target.hasAttribute('list')) {
                let listId = e.target.getAttribute('list');
                let value = e.target.value.trim();
                if (value && listId) {
                    let cleanVal = (listId === 'dl_xk_nd_table' || listId === 'dl_dx_nd_table') ? cleanItemName(value) : value;
                    let currentList = getSafeJSON('vtf_custom_suggest_' + listId, []);
                    if (!currentList.includes(cleanVal)) {
                        currentList.push(cleanVal);
                        localStorage.setItem('vtf_custom_suggest_' + listId, JSON.stringify(currentList));
                        updateSuggestions(); 
                    }
                }
            }
        });

        window.harvestSuggestions = function() {
            document.querySelectorAll('input[list]').forEach(el => {
                let val = el.value.trim();
                let listId = el.getAttribute('list');
                if(val && listId) {
                    let cleanVal = listId === 'dl_xk_nd_table' ? cleanItemName(val) : val;
                    let currentList = getSafeJSON('vtf_custom_suggest_' + listId, []);
                    if (!currentList.includes(cleanVal)) {
                        currentList.push(cleanVal);
                        localStorage.setItem('vtf_custom_suggest_' + listId, JSON.stringify(currentList));
                    }
                }
            });
            updateSuggestions();
        }

        function enforceInventoryMath(tonkho) {
            tonkho.forEach(item => {
                item.tong = parseFloat(item.tong) || 0;
                item.xe = parseFloat(item.xe) || 0;
                item.hop = parseFloat(item.hop) || 0;
                item.nha = item.tong - item.xe - item.hop;
            });
            return tonkho;
        }

        document.addEventListener("DOMContentLoaded", () => {
            const user = getSafeJSON('vtf_current_user', null);
            if(!user) { location.href = '/'; return; }
            
            document.getElementById('user-welcome-name').innerText = user.name === 'Admin' ? 'Tài khoản: ADMIN' : 'Xin chào: ' + user.name;

            if(user.role !== 'admin') {
                document.getElementById('nav-setting').style.display = 'none';
                let perms = user.perms || [];
                ['thu','chi','dexuat','thanhtoan','bangiao','xuat','nhap','ton', 'thongbao'].forEach(id => {
                    let nav = document.getElementById('nav-' + id);
                    if(nav) nav.style.display = perms.includes(id) ? 'block' : 'none';
                });
                
                if(perms.length > 0) showTab(perms[0]);
                else showTab('luutru');
            } else {
                renderUsers();
                showTab('thu');
            }
        });

        function logout() {
            localStorage.removeItem('vtf_current_user');
            location.href = '/';
        }

        function renderUsers() {
            let users = getSafeJSON('vtf_users', []);
            let html = users.map((u, i) => \`<tr>
                <td class="bold" style="color:#0f172a;">\${u.u}</td>
                <td style="color:#059669;">\${u.perms.join(', ').toUpperCase()}</td>
                <td class="text-center"><button onclick="deleteUser(\${i})" class="btn-mini" style="background:#fee2e2; color:#ef4444; padding:5px 15px;">Xóa</button></td>
            </tr>\`).join('');
            let tbody = document.querySelector('#tbl_users tbody');
            if(tbody) tbody.innerHTML = html;
        }

        function addUser() {
            let u = document.getElementById('new_u').value.trim();
            let p = document.getElementById('new_p').value.trim();
            if(!u || !p) return alert("Vui lòng nhập đủ Tên đăng nhập và Mật khẩu!");
            let perms = Array.from(document.querySelectorAll('.cb-perm:checked')).map(cb => cb.value);
            
            let users = getSafeJSON('vtf_users', []);
            if(users.find(x => x.u === u) || u === 'admin') return alert("Tên đăng nhập đã tồn tại!");
            
            users.push({u, p, perms});
            localStorage.setItem('vtf_users', JSON.stringify(users));
            alert("Đã thêm tài khoản phụ thành công!");
            document.getElementById('new_u').value = '';
            document.getElementById('new_p').value = '';
            renderUsers();
        }

        function deleteUser(i) {
            if(!confirm("Bạn có chắc chắn muốn xóa tài khoản này?")) return;
            let users = getSafeJSON('vtf_users', []);
            users.splice(i, 1);
            localStorage.setItem('vtf_users', JSON.stringify(users));
            renderUsers();
        }

        function updateSuggestions() {
            let thu = getSafeJSON('danhSach_thu', []);
            let chi = getSafeJSON('danhSach_chi', []);
            let dx = getSafeJSON('danhSach_dexuat', []);
            let tt = getSafeJSON('danhSach_thanhtoan', []);
            let bg = getSafeJSON('danhSach_bangiao', []);
            let xk = getSafeJSON('danhSach_xuat', []);

            let names = new Set(), addresses = new Set(), contents = new Set(), 
                dx_reasons = new Set(), dx_kg = new Set(), dx_nd_table = new Set(), signatures = new Set();

            thu.forEach(item => {
                if(item.pt_tennguoinop) names.add(item.pt_tennguoinop);
                if(item.pt_diachi) addresses.add(item.pt_diachi);
            });
            chi.forEach(item => {
                if(item.pc_tennguoinhan) names.add(item.pc_tennguoinhan);
                if(item.pc_diachi) addresses.add(item.pc_diachi);
                if(item.pc_noidung) contents.add(item.pc_noidung);
            });

            getSafeJSON('vtf_custom_suggest_dl_names', []).forEach(x => names.add(x));
            getSafeJSON('vtf_custom_suggest_dl_addresses', []).forEach(x => addresses.add(x));
            getSafeJSON('vtf_custom_suggest_dl_contents', []).forEach(x => contents.add(x));
            getSafeJSON('vtf_custom_suggest_dl_lydo', []).forEach(x => dx_reasons.add(x));
            getSafeJSON('vtf_custom_suggest_dl_kinhgui', []).forEach(x => dx_kg.add(x));
            getSafeJSON('vtf_custom_suggest_dl_ky', []).forEach(x => signatures.add(x));
            getSafeJSON('vtf_custom_suggest_dl_dx_nd_table', []).forEach(x => dx_nd_table.add(x));

            let tonkho = getSafeJSON('vtf_tonkho', []);
            tonkho = enforceInventoryMath(tonkho);
            let xkOptions = new Set();
            
            tonkho.forEach(t => {
                if(t.name) {
                    xkOptions.add(\`\${t.name} (Tồn: \${t.nha || 0})\`);
                    dx_nd_table.add(t.name);
                }
            });
            
            let customXk = getSafeJSON('vtf_custom_suggest_dl_xk_nd_table', []);
            customXk.forEach(c => {
                if (!tonkho.find(t => t.name === cleanItemName(c))) xkOptions.add(c);
            });

            let genList = (id, set) => \`<datalist id="\${id}">\${Array.from(set).map(val => \`<option value="\${val}">\`).join('')}</datalist>\`;
            
            document.getElementById('datalists-container').innerHTML = 
                genList('dl_names', names) + genList('dl_addresses', addresses) + genList('dl_contents', contents) +
                genList('dl_lydo', dx_reasons) + genList('dl_kinhgui', dx_kg) + genList('dl_ky', signatures) + 
                genList('dl_dx_nd_table', dx_nd_table) + genList('dl_xk_nd_table', xkOptions);
        }

        function cleanItemName(rawName) {
            if (!rawName) return '';
            return rawName.replace(/\\s*\\(Tồn:\\s*-?\\d+\\)\\s*$/, '').trim();
        }

        function updateAllDots() {
            document.querySelectorAll('.dot-input, .header-input').forEach(el => {
                if(!el.classList.contains('dx-input') && !el.classList.contains('tt-item') && !el.classList.contains('header-input')) { 
                    el.style.borderBottomColor = el.value.trim() !== '' ? 'transparent' : '#64748b';
                }
            });
        }

        document.addEventListener('input', (e) => {
          if(e.target.classList.contains('dot-input') && !e.target.classList.contains('dx-input') && !e.target.classList.contains('tt-item') && !e.target.classList.contains('header-input')) {
             e.target.style.borderBottomColor = e.target.value.trim() !== '' ? 'transparent' : '#64748b';
          }
        });

        // --- BẢNG ĐỀ XUẤT ---
        function updateDxRowNumbers() {
            let rows = document.querySelectorAll('#dx_table tbody tr');
            rows.forEach((tr, index) => { tr.querySelector('.td-stt').innerText = index + 1; });
        }

        window.addDxRow = function(nd = '', sl = '', gc = '') {
            let tbody = document.querySelector('#dx_table tbody');
            let tr = document.createElement('tr');
            tr.innerHTML = \`
                <td class="text-center td-stt" style="font-weight: bold;"></td>
                <td><input type="text" class="dx-input dx-td-nd" list="dl_dx_nd_table" value="\${nd}"></td>
                <td><input type="text" class="dx-input dx-td-sl text-center" value="\${sl}"></td>
                <td><input type="text" class="dx-input dx-td-gc" value="\${gc}"></td>
            \`;
            tbody.appendChild(tr);
            updateDxRowNumbers(); 
        }

        window.removeDxRow = function() {
            let tbody = document.querySelector('#dx_table tbody');
            if(tbody.querySelectorAll('tr').length > 1) { tbody.removeChild(tbody.lastElementChild); updateDxRowNumbers(); }
        }

        function getDxTableData() {
            let rows = document.querySelectorAll('#dx_table tbody tr');
            let arr = []; let textForGS = "";
            rows.forEach((tr, idx) => {
                let nd = tr.querySelector('.dx-td-nd').value;
                let sl = tr.querySelector('.dx-td-sl').value;
                let gc = tr.querySelector('.dx-td-gc').value;
                arr.push({nd, sl, gc});
                if(nd || sl || gc) textForGS += (idx+1) + ". " + nd + (sl ? " (SL: " + sl + ")" : "") + (gc ? " - Ghi chú: " + gc : "") + "\\n";
            });
            return { json: JSON.stringify(arr), text: textForGS.trim() };
        }

        // --- BẢNG BÀN GIAO ---
        function updateBgRowNumbers() {
            let rows = document.querySelectorAll('#bg_table tbody tr');
            rows.forEach((tr, index) => { tr.querySelector('.td-stt').innerText = index + 1; });
        }

        window.addBgRow = function(nd = '') {
            let tbody = document.querySelector('#bg_table tbody');
            let tr = document.createElement('tr');
            tr.innerHTML = \`
                <td class="text-center td-stt" style="font-weight: bold;"></td>
                <td><input type="text" class="dx-input bg-td-nd" list="dl_dx_nd_table" value="\${nd}"></td>
            \`;
            tbody.appendChild(tr);
            updateBgRowNumbers(); 
        }

        window.removeBgRow = function() {
            let tbody = document.querySelector('#bg_table tbody');
            if(tbody.querySelectorAll('tr').length > 1) { tbody.removeChild(tbody.lastElementChild); updateBgRowNumbers(); }
        }

        function getBgTableData() {
            let rows = document.querySelectorAll('#bg_table tbody tr');
            let arr = []; let textForGS = "";
            rows.forEach((tr, idx) => {
                let nd = tr.querySelector('.bg-td-nd').value;
                arr.push({nd});
                if(nd) textForGS += (idx+1) + ". " + nd + "\\n";
            });
            return { json: JSON.stringify(arr), text: textForGS.trim() };
        }

        // --- BẢNG XUẤT KHO / NHẬP KHO ---
        function updateXkRowNumbers() {
            document.querySelectorAll('#xk_table tbody tr').forEach((tr, index) => { tr.querySelector('.td-stt').innerText = index + 1; });
            document.querySelectorAll('#nk_table tbody tr').forEach((tr, index) => { tr.querySelector('.td-stt').innerText = index + 1; });
        }

        window.calcXkTotal = function() {
            let t_sl = 0;
            document.querySelectorAll('#xk_table tbody tr').forEach(tr => { t_sl += Number(tr.querySelector('.xk-td-sl').value) || 0; });
            if(document.getElementById('xk_tong_sl')) document.getElementById('xk_tong_sl').value = t_sl || '';
        }
        window.calcNkTotal = function() {
            let t_sl = 0;
            document.querySelectorAll('#nk_table tbody tr').forEach(tr => { t_sl += Number(tr.querySelector('.nk-td-sl').value) || 0; });
            if(document.getElementById('nk_tong_sl')) document.getElementById('nk_tong_sl').value = t_sl || '';
        }

        window.addXkRow = function(nd='', sl='', gc='') {
            let tbody = document.querySelector('#xk_table tbody');
            let tr = document.createElement('tr');
            tr.innerHTML = \`<td class="text-center td-stt" style="font-weight: bold;"></td>
                <td><input type="text" class="dx-input xk-td-nd" list="dl_xk_nd_table" value="\${nd}"></td>
                <td><input type="number" class="dx-input xk-td-sl text-center" value="\${sl}" oninput="calcXkTotal()"></td>
                <td><input type="text" class="dx-input xk-td-gc" value="\${gc}"></td>\`;
            tbody.appendChild(tr); updateXkRowNumbers(); calcXkTotal();
        }

        window.addNkRow = function(nd='', sl='', gc='') {
            let tbody = document.querySelector('#nk_table tbody');
            let tr = document.createElement('tr');
            tr.innerHTML = \`<td class="text-center td-stt" style="font-weight: bold;"></td>
                <td><input type="text" class="dx-input nk-td-nd" list="dl_xk_nd_table" value="\${nd}"></td>
                <td><input type="number" class="dx-input nk-td-sl text-center" value="\${sl}" oninput="calcNkTotal()"></td>
                <td><input type="text" class="dx-input nk-td-gc" value="\${gc}"></td>\`;
            tbody.appendChild(tr); updateXkRowNumbers(); calcNkTotal();
        }

        window.removeXkRow = function() {
            let tbody = document.querySelector('#xk_table tbody');
            if(tbody.querySelectorAll('tr').length > 1) { tbody.removeChild(tbody.lastElementChild); updateXkRowNumbers(); calcXkTotal(); }
        }
        window.removeNkRow = function() {
            let tbody = document.querySelector('#nk_table tbody');
            if(tbody.querySelectorAll('tr').length > 1) { tbody.removeChild(tbody.lastElementChild); updateXkRowNumbers(); calcNkTotal(); }
        }

        function getXkTableData(isNhap = false) {
            let tableId = isNhap ? '#nk_table' : '#xk_table';
            let clsNd = isNhap ? '.nk-td-nd' : '.xk-td-nd';
            let clsSl = isNhap ? '.nk-td-sl' : '.xk-td-sl';
            let clsGc = isNhap ? '.nk-td-gc' : '.xk-td-gc';

            let rows = document.querySelectorAll(tableId + ' tbody tr');
            let arr = []; let textForGS = "";
            rows.forEach((tr, idx) => {
                let nd = cleanItemName(tr.querySelector(clsNd).value); 
                let sl = tr.querySelector(clsSl).value;
                let gc = tr.querySelector(clsGc).value;
                arr.push({nd, sl, gc});
                if(nd || sl || gc) textForGS += (idx+1) + ". " + nd + " (SL: " + sl + (gc ? ", GC: " + gc : "") + ")" + "\\n";
            });
            return { json: JSON.stringify(arr), text: textForGS.trim() };
        }

        // --- GẠCH ĐẦU DÒNG THANH TOÁN ---
        window.addTtRow = function(val = '') {
            let container = document.getElementById('tt_items_container');
            let div = document.createElement('div');
            div.innerHTML = \`- <input type="text" class="dot-input tt-item" style="width: 80%; margin-bottom: 5px; border-bottom-color: \${val ? 'transparent' : '#64748b'}" list="dl_dx_nd_table" value="\${val}">\`;
            container.appendChild(div);
        }

        window.removeTtRow = function() {
            let container = document.getElementById('tt_items_container');
            if(container.children.length > 1) {
                container.removeChild(container.lastElementChild);
            }
        }

        function getTtItemsData() {
            let inputs = document.querySelectorAll('.tt-item');
            let arr = [];
            inputs.forEach(inp => { if(inp.value) arr.push(inp.value); });
            return { json: JSON.stringify(arr), text: arr.map(x => "- " + x).join("\\n") };
        }

        // --- TỒN KHO & KIỂM KHO ---
        window.updateKhoField = function(inputEl, sp, field) {
            let tonkho = getSafeJSON('vtf_tonkho', []);
            let item = tonkho.find(x => x.name === sp);
            if (item) {
                if (field === 'tong') item.tong = parseFloat(inputEl.value) || 0;
                if (field === 'hop') item.hop = parseFloat(inputEl.value) || 0;
                
                item.nha = (item.tong || 0) - (item.xe || 0) - (item.hop || 0);
                
                let tr = inputEl.closest('tr');
                if(tr) {
                    tr.querySelector('.kho-val').innerText = item.nha;
                    calcLech(tr.querySelector('.thuc-te-input'));
                }
                localStorage.setItem('vtf_tonkho', JSON.stringify(tonkho));
                updateSuggestions();
            }
        }

        function loadTonKho() {
            const currentUser = getSafeJSON('vtf_current_user', {});
            const canEditTon = currentUser.role === 'admin' || (currentUser.perms && currentUser.perms.includes('edit_ton'));
            
            document.getElementById('ton-add-bar').style.display = canEditTon ? 'flex' : 'none';

            let tonkho = getSafeJSON('vtf_tonkho', []);
            tonkho = enforceInventoryMath(tonkho); 
            localStorage.setItem('vtf_tonkho', JSON.stringify(tonkho));
            let tbody = document.querySelector('#inventory-table tbody');
            tbody.innerHTML = '';
            tonkho.forEach(t => { addTonRowUI(t.name, t.tong || 0, t.xe || 0, t.nha || 0, t.hop || 0, t.nha || 0, canEditTon); });
            updateTonCount();
        }

        window.calcLech = function(input) {
            let row = input.closest('tr');
            let nhaKho = parseFloat(row.querySelector('.kho-val').innerText) || 0;
            let thucTe = parseFloat(input.value) || 0;
            let lech = thucTe - nhaKho;
            
            let tdLech = row.querySelector('.sl-lech');
            tdLech.innerText = lech > 0 ? \`+\${lech}\` : lech;
            if(lech > 0) tdLech.style.color = '#22c55e';
            else if(lech < 0) tdLech.style.color = '#ef4444';
            else tdLech.style.color = '#64748b';
        }

        window.addNewTonRow = function() {
            let rawSp = document.getElementById('ton_tk_sp').value.trim();
            let sp = cleanItemName(rawSp);
            if(!sp) { alert('Vui lòng chọn hoặc nhập tên sản phẩm!'); return; }
            
            let tonkho = getSafeJSON('vtf_tonkho', []);
            if(tonkho.find(x => x.name === sp)) { alert('Sản phẩm này đã có trong kho!'); return; }

            tonkho.push({name: sp, tong: 0, xe: 0, nha: 0, hop: 0});
            tonkho = enforceInventoryMath(tonkho);
            localStorage.setItem('vtf_tonkho', JSON.stringify(tonkho));
            loadTonKho();
            document.getElementById('ton_tk_sp').value = '';
            updateSuggestions();
        }

        function addTonRowUI(sp='', tong='0', xe='0', nha='0', hop='0', thucTe='0', canEditTon=true) {
            let r_attr = canEditTon ? '' : 'readonly';
            let r_style = canEditTon ? 'border: 1px solid #cbd5e1 !important;' : 'border: none !important; background: transparent; pointer-events:none;';
            let del_btn = canEditTon ? \`<button onclick="removeTonKhoItem('\${sp}')" style="background:none; border:none; color:#ef4444; cursor:pointer; font-weight:bold;">X</button>\` : '';

            let tbody = document.querySelector('#inventory-table tbody');
            let tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #e2e8f0';
            tr.innerHTML = \`
                <td style="text-align: left; padding:8px; border: 1px solid #e2e8f0;">
                    <input type="text" class="dx-input ton-sp-name" style="color:#3b82f6; font-family:'Segoe UI', sans-serif;" value="\${sp}" readonly>
                </td>
                <td style="padding:8px; border: 1px solid #e2e8f0;">
                    <input type="number" class="dx-input text-center ton-tong-val" style="font-family:'Segoe UI', sans-serif; width: 60px; border-radius: 4px; \${r_style}" value="\${tong}" \${r_attr} oninput="updateKhoField(this, '\${sp}', 'tong')">
                </td>
                <td style="padding:8px; border: 1px solid #e2e8f0; color:#64748b;">\${xe}</td>
                <td style="padding:8px; border: 1px solid #e2e8f0; color:#64748b;"><span class="kho-val">\${nha}</span></td>
                <td style="padding:8px; border: 1px solid #e2e8f0;">
                    <input type="number" class="dx-input text-center ton-hop-val" style="font-family:'Segoe UI', sans-serif; width: 50px; border-radius: 4px; color:#ef4444; \${r_style}" value="\${hop}" \${r_attr} oninput="updateKhoField(this, '\${sp}', 'hop')">
                </td>
                <td style="padding:8px; border: 1px solid #e2e8f0;">
                    <input type="number" class="thuc-te-input" value="\${thucTe}" style="width: 60px; padding: 5px; text-align: center; border-radius: 4px; \${r_style}" \${r_attr} oninput="calcLech(this)">
                </td>
                <td class="sl-lech" style="padding:8px; font-weight: bold; border: 1px solid #e2e8f0;"></td>
                <td style="padding:8px; border: 1px solid #e2e8f0;">\${del_btn}</td>
            \`;
            tbody.appendChild(tr);
            calcLech(tr.querySelector('.thuc-te-input'));
        }

        window.removeTonKhoItem = function(sp) {
            if(!confirm('Bạn có chắc muốn xóa sản phẩm này khỏi Kho?')) return;
            let tonkho = getSafeJSON('vtf_tonkho', []);
            tonkho = tonkho.filter(x => x.name !== sp);
            localStorage.setItem('vtf_tonkho', JSON.stringify(tonkho));
            loadTonKho();
            updateSuggestions();
        }

        function updateTonCount() {
            let rows = document.querySelectorAll('#inventory-table tbody tr').length;
            let pagination = document.getElementById('ton-pagination');
            if (pagination) pagination.innerText = rows > 0 ? \`1 - \${rows} / \${rows} sản phẩm\` : \`0 - 0 / 0 sản phẩm\`;
            let badge = document.getElementById('badge-all');
            if (badge) badge.innerText = rows;
        }

        // --- CÁC HÀM CHÍNH ---
        window.showTab = function(tabId, isReopening = false) {
          document.querySelectorAll('.form-container, #welcome-msg').forEach(el => el.style.display = 'none');
          document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active-menu'));
          if(document.getElementById('nav-' + tabId)) document.getElementById('nav-' + tabId).classList.add('active-menu');

          if (['thu', 'chi', 'dexuat', 'thanhtoan', 'bangiao', 'xuat', 'nhap', 'ton', 'setting', 'thongbao'].includes(tabId)) {
            currentActiveForm = tabId;
            document.getElementById('form-' + tabId).style.display = 'block';
            
            if (tabId === 'dexuat' && document.querySelector('#dx_table tbody').innerHTML.trim() === '') addDxRow();
            if (tabId === 'thanhtoan' && document.getElementById('tt_items_container').innerHTML.trim() === '') addTtRow();
            if (tabId === 'bangiao' && document.querySelector('#bg_table tbody').innerHTML.trim() === '') addBgRow();
            if (tabId === 'xuat' && document.querySelector('#xk_table tbody').innerHTML.trim() === '') addXkRow();
            if (tabId === 'nhap') {
                if(document.querySelector('#nk_table tbody').innerHTML.trim() === '') addNkRow();
                toggleNhapView('list');
            }
            if (tabId === 'ton') loadTonKho();
            if (tabId === 'thongbao') viewThongBao();

            if(!isReopening) autoFillDateAndNumber(); 
            updateAllDots(); updateSuggestions();
          } else if (tabId === 'luutru') {
            document.getElementById('form-luutru').style.display = 'block';
            let t = ['thu','chi','dexuat','thanhtoan','bangiao','xuat','nhap'].includes(currentActiveForm) ? currentActiveForm : 'thu';
            viewArchive(t); 
          } else {
            document.getElementById('welcome-msg').style.display = 'block';
            document.getElementById('welcome-msg').innerHTML = '<h2 style="font-size:28px; color:#0f172a;">Tính năng đang cập nhật</h2><p>Vui lòng quay lại sau!</p>';
          }
        }

        window.syncDx = function(value, type) {
            if(type === 'diadiem') { document.getElementById('dx_diadiem').value = value; document.getElementById('dx_diadiem_ky').value = value; }
            if(type === 'ngay') { document.getElementById('dx_ngay').value = value; document.getElementById('dx_ngay_ky').value = value; }
            if(type === 'thang') { document.getElementById('dx_thang').value = value; document.getElementById('dx_thang_ky').value = value; }
            if(type === 'nam') { document.getElementById('dx_nam').value = value; document.getElementById('dx_nam_ky').value = value; }
            updateAllDots();
        }

        function autoFillDateAndNumber() {
          const now = new Date();
          const d = String(now.getDate()).padStart(2, '0');
          const m = String(now.getMonth() + 1).padStart(2, '0');
          const y = now.getFullYear();
          
          let prefix = currentActiveForm === 'thu' ? 'pt_' : (currentActiveForm === 'chi' ? 'pc_' : (currentActiveForm === 'dexuat' ? 'dx_' : (currentActiveForm === 'thanhtoan' ? 'tt_' : (currentActiveForm === 'bangiao' ? 'bg_' : (currentActiveForm === 'xuat' ? 'xk_' : 'nk_')))));
          let formEl = document.getElementById('form-' + currentActiveForm);
          if(!formEl) return;
          
          formEl.querySelectorAll('.auto-d').forEach(el => el.value = d);
          formEl.querySelectorAll('.auto-m').forEach(el => el.value = m);
          formEl.querySelectorAll('.auto-y').forEach(el => el.value = y);

          let soPhieu = document.getElementById(prefix + 'sophieu');
          if(soPhieu && !soPhieu.value) {
              let list = getSafeJSON('danhSach_' + currentActiveForm, []);
              let textPrefix = currentActiveForm === 'dexuat' ? 'ĐX-' : (currentActiveForm === 'thanhtoan' ? 'TT-' : (currentActiveForm === 'bangiao' ? 'BG-' : (currentActiveForm === 'xuat' ? 'XK-' : 'NK-')));
              soPhieu.value = textPrefix + String(list.length + 1).padStart(3, '0') + '-' + m + '-' + y;
          }
        }

        window.syncName = function(type) {
          if(type === 'thu') document.getElementById('pt_ky_nguoinop').value = document.getElementById('pt_tennguoinop').value;
          if(type === 'chi') document.getElementById('pc_ky_nguoinhan').value = document.getElementById('pc_tennguoinhan').value;
          updateAllDots();
        }

        window.cancelEdit = function() {
            document.getElementById('edit-back-bar').style.display = 'none';
            resetForm();
            if(currentActiveForm === 'nhap') showTab('nhap');
            else showTab('luutru');
        }

        // --- LƯU VÀ IN ĐẶC BIỆT CHO XUẤT KHO ---
        window.saveXuatKho = function() {
            harvestSuggestions(); // Lưu gợi ý nhập tay
            let data = { id: Date.now(), time: new Date().toLocaleString('vi-VN'), formType: 'xuat', action: 'SAVE', status: 'cho_nhap' };
            inputsXuat.forEach(id => { let el = document.getElementById(id); if(el) data[id] = el.value; });
            
            let xkData = getXkTableData(false);
            data['xk_table_json'] = xkData.json;
            data['xk_chitiet_gs'] = xkData.text;

            let list = getSafeJSON('danhSach_xuat', []);
            let index = list.findIndex(item => item.xk_sophieu === data.xk_sophieu);
            
            let tonkho = getSafeJSON('vtf_tonkho', []);
            let newItems = JSON.parse(data['xk_table_json'] || '[]');
            
            if (index !== -1) { 
                data.id = list[index].id; 
                try {
                    let oldItems = JSON.parse(list[index].xk_table_json || '[]');
                    let oldStatus = list[index].status;
                    oldItems.forEach(old => {
                        let name = cleanItemName(old.nd);
                        let sl = parseFloat(old.sl) || 0;
                        let tkItem = tonkho.find(x => x.name === name);
                        if(tkItem && oldStatus === 'cho_nhap') { 
                            tkItem.xe -= sl;
                        }
                    });
                } catch(e){}
                list[index] = data; 
            } else { 
                list.unshift(data); 
            }

            // Chuyển hàng lên xe 🚚
            newItems.forEach(item => {
                let name = cleanItemName(item.nd);
                let sl = parseFloat(item.sl) || 0;
                if(name) {
                    let tkItem = tonkho.find(x => x.name === name);
                    if(!tkItem) {
                        tkItem = {name: name, tong: 0, nha: 0, xe: 0, hop: 0};
                        tonkho.push(tkItem);
                    }
                    tkItem.xe += sl;
                }
            });

            tonkho = enforceInventoryMath(tonkho);
            localStorage.setItem('vtf_tonkho', JSON.stringify(tonkho));
            localStorage.setItem('danhSach_xuat', JSON.stringify(list));
            updateSuggestions();

            document.body.className = 'print-a4-single';
            setTimeout(() => {
                window.print();
                document.getElementById('print-clone-area-xuat').innerHTML = '';
                document.body.className = ''; 
                document.getElementById('edit-back-bar').style.display = 'none';
                resetForm();
            }, 300);
        }

        // --- TẠO MỚI PHIẾU NHẬP KHO (TỪ NHÀ CUNG CẤP TỚI) ---
        window.saveNhapKhoMoi = function() {
            harvestSuggestions(); // Lưu gợi ý nhập tay
            let data = { id: Date.now(), time: new Date().toLocaleString('vi-VN'), formType: 'nhap', action: 'SAVE' };
            inputsNhap.forEach(id => { let el = document.getElementById(id); if(el) data[id] = el.value; });
            
            let nkData = getXkTableData(true); 
            data['nk_table_json'] = nkData.json;
            data['nk_chitiet_gs'] = nkData.text;

            let list = getSafeJSON('danhSach_nhap', []);
            let index = list.findIndex(item => item.nk_sophieu === data.nk_sophieu);
            
            let tonkho = getSafeJSON('vtf_tonkho', []);
            let newItems = JSON.parse(data['nk_table_json'] || '[]');
            
            if (index !== -1) { 
                data.id = list[index].id; 
                try {
                    let oldItems = JSON.parse(list[index].nk_table_json || '[]');
                    oldItems.forEach(old => {
                        let name = cleanItemName(old.nd);
                        let sl = parseFloat(old.sl) || 0;
                        let tkItem = tonkho.find(x => x.name === name);
                        if(tkItem) { tkItem.tong -= sl; } // Trừ hàng cũ đi để bù hàng mới
                    });
                } catch(e){}
                list[index] = data; 
            } else { 
                list.unshift(data); 
            }

            // CỘNG VÀO TỔNG SỐ LƯỢNG
            newItems.forEach(item => {
                let name = cleanItemName(item.nd);
                let sl = parseFloat(item.sl) || 0;
                if(name) {
                    let tkItem = tonkho.find(x => x.name === name);
                    if(!tkItem) {
                        tkItem = {name: name, tong: 0, nha: 0, xe: 0, hop: 0};
                        tonkho.push(tkItem);
                    }
                    tkItem.tong += sl; 
                }
            });

            tonkho = enforceInventoryMath(tonkho);
            localStorage.setItem('vtf_tonkho', JSON.stringify(tonkho));
            localStorage.setItem('danhSach_nhap', JSON.stringify(list));
            updateSuggestions();

            sendToGoogleSheets(data, 'SAVE');

            document.body.className = 'print-a4-single';
            setTimeout(() => {
                window.print();
                document.getElementById('print-clone-area-nhap').innerHTML = '';
                document.body.className = ''; 
                document.getElementById('edit-back-bar').style.display = 'none';
                resetForm();
                alert("Đã Lập phiếu Nhập kho mới! Số lượng đã được CỘNG thẳng vào Tổng Số Lượng.");
            }, 300);
        }

        // --- XỬ LÝ LƯU VÀ IN CHUNG CÁC FORM KHÁC ---
        window.savePrintAndReset = function(isNhapKho = false) {
            harvestSuggestions(); // Lưu gợi ý nhập tay
            
            let type = currentActiveForm;
            if(type === 'xuat') { saveXuatKho(); return; }
            if(type === 'nhap') { saveNhapKhoMoi(); return; }

            let prefix = type === 'thu' ? 'pt_' : (type === 'chi' ? 'pc_' : (type === 'dexuat' ? 'dx_' : (type === 'thanhtoan' ? 'tt_' : 'bg_')));
            let activeInputs = type === 'thu' ? inputsThu : (type === 'chi' ? inputsChi : (type === 'dexuat' ? inputsDexuat : (type === 'thanhtoan' ? inputsThanhtoan : inputsBangiao)));

            let data = { id: Date.now(), time: new Date().toLocaleString('vi-VN'), formType: type, action: 'SAVE' };
            activeInputs.forEach(id => { let el = document.getElementById(id); if(el) data[id] = el.value; });

            if(type === 'dexuat') { data['dx_chitiet_gs'] = getDxTableData().text; data['dx_table_json'] = getDxTableData().json; }
            if(type === 'thanhtoan') { data['tt_chitiet_gs'] = getTtItemsData().text; data['tt_items_json'] = getTtItemsData().json; }
            if(type === 'bangiao') { data['bg_chitiet_gs'] = getBgTableData().text; data['bg_table_json'] = getBgTableData().json; }

            let list = getSafeJSON('danhSach_' + type, []);
            let index = list.findIndex(item => item[prefix + 'sophieu'] === data[prefix + 'sophieu']);
            if (index !== -1) { data.id = list[index].id; list[index] = data; } else { list.unshift(data); }
            localStorage.setItem('danhSach_' + type, JSON.stringify(list));
            sendToGoogleSheets(data, 'SAVE');
            updateSuggestions(); 

            let paperSize = document.getElementById('print-format-' + type) ? document.getElementById('print-format-' + type).value : 'A4';
            let printClass = (['thu', 'chi', 'bangiao'].includes(type) && paperSize === 'A4') ? 'print-a4-double' : (['thu', 'chi', 'bangiao'].includes(type) ? 'print-a5' : 'print-a4-single');
            document.body.className = printClass;
            if (printClass === 'print-a4-double') preparePrintDouble(type);

            setTimeout(() => {
                window.print();
                let cloneArea = document.getElementById('print-clone-area-' + type);
                if (cloneArea) cloneArea.innerHTML = '';
                document.body.className = ''; 
                document.getElementById('edit-back-bar').style.display = 'none';
                resetForm();
            }, 300);
        }

        // --- XÁC NHẬN NHẬP KHO TỪ PHIẾU XUẤT ---
        window.toggleNhapView = function(view) {
            document.querySelectorAll('#form-nhap .archive-tab').forEach(el => el.classList.remove('active'));
            document.getElementById('btn-nhap-' + view).classList.add('active');
            if(view === 'list') {
                document.getElementById('nhap-view-list').style.display = 'block';
                document.getElementById('nhap-view-doc').style.display = 'none';
                viewPendingNhap();
            } else {
                document.getElementById('nhap-view-list').style.display = 'none';
                document.getElementById('nhap-view-doc').style.display = 'block';
                document.getElementById('nhap-buttons-normal').style.display = 'flex';
                document.getElementById('nhap-buttons-confirm').style.display = 'none';
                autoFillDateAndNumber();
            }
        }

        function viewPendingNhap() {
            let contentArea = document.getElementById('nhap-pending-content');
            let list = getSafeJSON('danhSach_xuat', []).filter(x => x.status === 'cho_nhap');

            if (list.length > 0) {
                let rows = list.map((item, index) => {
                    return \`<tr>
                        <td style="color:#64748b; text-align:center;">\${item.time}</td>
                        <td><strong style="color:#0f172a;">\${item.xk_sophieu}</strong></td>
                        <td style="font-weight:500;">\${item.xk_tennguoinhan || ''}</td>
                        <td>\${item.xk_lydo || ''}</td>
                        <td>
                            <button onclick="openConfirmNhapKho('\${item.xk_sophieu}')" class="btn-modern" style="background:#3b82f6; color:white; padding:6px 15px; font-size:13px; font-weight:bold; cursor:pointer;">Xác nhận</button>
                        </td>
                    </tr>\`
                }).join('');
                contentArea.innerHTML = \`<table class="data-table"><tr><th width="15%" style="text-align:center;">Thời gian</th><th width="15%">Số Phiếu Xuất</th><th width="30%">Người nhận</th><th width="20%">Lý do</th><th width="20%">Thao tác</th></tr>\` + rows + \`</table>\`;
            } else { contentArea.innerHTML = '<p style="color:#64748b; font-style:italic; padding: 20px;">Không có phiếu xuất nào chờ xác nhận.</p>'; }
        }

        window.openConfirmNhapKho = function(soPhieu) {
            let list = getSafeJSON('danhSach_xuat', []);
            let data = list.find(x => x.xk_sophieu === soPhieu);
            if(!data) return;

            document.getElementById('nk_sophieu').value = data.xk_sophieu;
            document.getElementById('nk_donvi').value = data.xk_donvi || 'Liên đoàn Taekwondo TP. Hồ Chí Minh';
            document.getElementById('nk_bophan_dv').value = data.xk_bophan_dv || 'Văn Phòng';
            document.getElementById('nk_tennguoinhan').value = data.xk_tennguoinhan || '';
            document.getElementById('nk_lydo').value = data.xk_lydo || '';
            
            let tbody = document.querySelector('#nk_table tbody');
            tbody.innerHTML = '';
            try {
                let arr = JSON.parse(data.xk_table_json || '[]');
                arr.forEach(item => addNkRow(item.nd, item.sl, item.gc));
            } catch(e){}
            calcNkTotal();

            document.getElementById('nhap-buttons-normal').style.display = 'none';
            document.getElementById('nhap-buttons-confirm').style.display = 'flex';
            document.getElementById('btn-confirm-nhap-final').setAttribute('onclick', \`submitConfirmNhapKho('\${soPhieu}')\`);

            document.getElementById('nhap-view-list').style.display = 'none';
            document.getElementById('nhap-view-doc').style.display = 'block';
            updateAllDots();
        }

        window.submitConfirmNhapKho = function(soPhieu) {
            harvestSuggestions(); // Lưu gợi ý
            let list = getSafeJSON('danhSach_xuat', []);
            let idx = list.findIndex(x => x.xk_sophieu === soPhieu);
            if(idx === -1) return;
            
            let item = list[idx];
            if(item.status === 'da_nhap') return;

            let nkData = getXkTableData(true);
            
            // XỬ LÝ LỆCH KHI NHẬP KHO (Không chạm vào TỔNG)
            let tonkho = getSafeJSON('vtf_tonkho', []);
            let oldItemsArr = [];
            try { oldItemsArr = JSON.parse(item.xk_table_json || '[]'); } catch(e){}
            let newItemsArr = [];
            try { newItemsArr = JSON.parse(nkData.json || '[]'); } catch(e){}

            oldItemsArr.forEach(oldItem => {
                let name = cleanItemName(oldItem.nd);
                let sl_xuat = parseFloat(oldItem.sl) || 0;
                let tkItem = tonkho.find(x => x.name === name);
                
                if(tkItem) {
                    let matchedNew = newItemsArr.find(n => cleanItemName(n.nd) === name);
                    let sl_nhap = matchedNew ? (parseFloat(matchedNew.sl) || 0) : 0;
                    let sl_hong = sl_xuat - sl_nhap; 
                    if (sl_hong < 0) sl_hong = 0;

                    tkItem.xe -= sl_xuat; 
                    if (tkItem.xe < 0) tkItem.xe = 0;
                    tkItem.hop = (tkItem.hop || 0) + sl_hong; 
                }
            });

            // Nếu người ta khai dư thêm sản phẩm lúc Nhập so với lúc xuất
            newItemsArr.forEach(newItem => {
                let name = cleanItemName(newItem.nd);
                let sl_nhap = parseFloat(newItem.sl) || 0;
                let isOld = oldItemsArr.find(o => cleanItemName(o.nd) === name);
                if(!isOld && name) {
                    let tkItem = tonkho.find(x => x.name === name);
                    if(!tkItem) { tkItem = {name: name, tong: 0, nha: 0, xe: 0, hop: 0}; tonkho.push(tkItem); }
                    tkItem.tong += sl_nhap;
                }
            });

            tonkho = enforceInventoryMath(tonkho);
            localStorage.setItem('vtf_tonkho', JSON.stringify(tonkho));

            item.xk_table_json = nkData.json;
            item.xk_chitiet_gs = nkData.text;
            item.status = 'da_nhap';
            localStorage.setItem('danhSach_xuat', JSON.stringify(list));

            item.formType = 'xuat'; 
            sendToGoogleSheets(item, 'SAVE');

            let notedItems = newItemsArr.filter(i => i.gc && i.gc.trim() !== '');
            let msg = '';
            if(notedItems.length === 0) {
                msg = \`✅ Đã xác nhận nhập kho thành công Phiếu: \${soPhieu}.\`;
            } else {
                let noteText = notedItems.map(i => \`\${cleanItemName(i.nd)} (\${i.gc})\`).join(', ');
                msg = \`⚠️ Nhập kho Phiếu \${soPhieu}. Có thiết bị ghi chú: \${noteText}\`;
            }

            let tbList = getSafeJSON('vtf_thongbao', []);
            let tbData = { id: Date.now(), time: new Date().toLocaleString('vi-VN'), formType: 'thongbao', tb_noidung: msg };
            tbList.unshift(tbData);
            localStorage.setItem('vtf_thongbao', JSON.stringify(tbList));
            sendToGoogleSheets(tbData, 'SAVE');

            alert("Đã Xác nhận Nhập Kho thành công! Số hàng thiếu/hỏng (nếu có) đã tự động chuyển vào cột 📦 Hư hỏng.");
            toggleNhapView('list'); 
        }

        window.viewThongBao = function() {
            let contentArea = document.getElementById('thongbao-content');
            let list = getSafeJSON('vtf_thongbao', []);
            const currentUser = getSafeJSON('vtf_current_user', {});
            const isAdmin = currentUser.role === 'admin';

            if (list.length > 0) {
                let rows = list.map(item => \`<tr>
                    <td style="color:#64748b; font-weight:bold; font-size:13px;">\${item.time}</td>
                    <td style="color:\${item.tb_noidung.includes('⚠️') ? '#ef4444' : '#10b981'}; font-weight:500;">\${item.tb_noidung}</td>
                    \${isAdmin ? \`<td class="text-center"><button onclick="deleteThongBao(\${item.id})" class="btn-mini" style="background:#fee2e2; color:#ef4444; padding:4px 10px;">Xóa</button></td>\` : ''}
                </tr>\`).join('');
                
                let thThaoTac = isAdmin ? \`<th width="10%" style="text-align:center;">Thao tác</th>\` : '';
                contentArea.innerHTML = \`<table class="data-table"><tr><th width="20%">Thời gian</th><th>Nội dung thông báo</th>\${thThaoTac}</tr>\` + rows + \`</table>\`;
            } else { contentArea.innerHTML = '<p style="color:#64748b; font-style:italic;">Chưa có thông báo nào.</p>'; }
        }

        window.deleteThongBao = function(id) {
            if(!confirm("Bạn có chắc chắn muốn xóa thông báo này?")) return;
            let list = getSafeJSON('vtf_thongbao', []);
            list = list.filter(x => x.id !== id);
            localStorage.setItem('vtf_thongbao', JSON.stringify(list));
            viewThongBao();
            
            let paramObj = { formType: 'thongbao', action: 'DELETE', id: id };
            fetch(scriptURL, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(paramObj) });
        }

        function sendToGoogleSheets(data, action) {
            let status = document.getElementById('gsheet-status-' + currentActiveForm);
            if(status) { status.style.display = 'block'; status.style.color = '#059669'; status.innerText = "⏳ Đang đồng bộ..."; }
            let formData = new URLSearchParams();
            for (const key in data) formData.append(key, data[key]);

            fetch(scriptURL, { method: 'POST', mode: 'no-cors', body: formData })
            .then(() => { if(status) { status.innerText = "✅ Đồng bộ thành công!"; setTimeout(() => status.style.display = 'none', 3000); }})
            .catch(() => { if(status) { status.innerText = "❌ Lỗi mạng!"; status.style.color = "#ef4444"; }});
        }

        function preparePrintDouble(type) {
            let original = document.getElementById('c40-original-' + type);
            if(!original) return;
            let clone = original.cloneNode(true);
            let originalInputs = original.querySelectorAll('input');
            let clonedInputs = clone.querySelectorAll('input');
            originalInputs.forEach((inp, idx) => clonedInputs[idx].setAttribute('value', inp.value));
            let cloneArea = document.getElementById('print-clone-area-' + type);
            if(cloneArea) {
                cloneArea.innerHTML = '<div class="print-separator"></div>';
                cloneArea.appendChild(clone);
            }
        }

        function resetForm() {
            let type = currentActiveForm;
            if (!['thu', 'chi', 'dexuat', 'thanhtoan', 'bangiao', 'xuat', 'nhap'].includes(type)) return;

            let activeInputs = type === 'thu' ? inputsThu : (type === 'chi' ? inputsChi : (type === 'dexuat' ? inputsDexuat : (type === 'thanhtoan' ? inputsThanhtoan : (type === 'bangiao' ? inputsBangiao : (type === 'nhap' ? inputsNhap : inputsXuat)))));
            let activeKeeps = type === 'thu' ? keepsThu : (type === 'chi' ? keepsChi : (type === 'dexuat' ? keepsDexuat : (type === 'thanhtoan' ? keepsThanhtoan : (type === 'bangiao' ? keepsBangiao : (type === 'nhap' ? keepsNhap : keepsXuat)))));

            activeInputs.forEach(id => {
              if(!activeKeeps.includes(id) && document.getElementById(id)) document.getElementById(id).value = '';
            });

            if (type === 'dexuat') { document.querySelector('#dx_table tbody').innerHTML = ''; addDxRow(); }
            if (type === 'thanhtoan') { document.getElementById('tt_items_container').innerHTML = ''; addTtRow(); document.getElementById('tt_txt_kinhgui').innerText = document.getElementById('tt_kinhgui').value || '...'; document.getElementById('tt_txt_veviec').innerText = document.getElementById('tt_veviec').value || '...'; }
            if (type === 'bangiao') { document.querySelector('#bg_table tbody').innerHTML = ''; addBgRow(); }
            if (type === 'xuat') { document.querySelector('#xk_table tbody').innerHTML = ''; addXkRow(); calcXkTotal(); }
            if (type === 'nhap') { document.querySelector('#nk_table tbody').innerHTML = ''; addNkRow(); calcNkTotal(); }

            autoFillDateAndNumber(); updateAllDots();
        }

        window.clearData = function() { if(confirm("Xóa trắng tờ mẫu?")) resetForm(); }

        window.viewArchive = function(type) {
            document.querySelectorAll('.archive-tab').forEach(el => el.classList.remove('active'));
            if(document.getElementById('tab-lt-' + type)) document.getElementById('tab-lt-' + type).classList.add('active');

            let contentArea = document.getElementById('archive-content');
            let list = getSafeJSON('danhSach_' + type, []);
            if(type === 'xuat') list = list.filter(x => x.status !== 'cho_nhap');

            let prefix = type === 'thu' ? 'pt_' : (type === 'chi' ? 'pc_' : (type === 'dexuat' ? 'dx_' : (type === 'thanhtoan' ? 'tt_' : (type === 'bangiao' ? 'bg_' : (type === 'nhap' ? 'nk_' : 'xk_')))));
            
            let personTitle = type === 'chi' ? 'Người nhận' : (type === 'dexuat' ? 'Kính gửi' : (type === 'thanhtoan' ? 'Người đề nghị' : (type === 'bangiao' ? 'Bên giao' : (['xuat', 'nhap'].includes(type) ? 'Người nhận hàng' : 'Người nộp'))));

            if (list.length > 0) {
                const currentUser = getSafeJSON('vtf_current_user', {});

                let rows = list.map((item, index) => {
                    let col3 = item[prefix + 'tennguoinop'] || item[prefix + 'tennguoinhan'] || item[prefix + 'kinhgui'] || item[prefix + 'nguoidenghi'] || item[prefix + 'bengiao'] || '';
                    let col4 = item[prefix + 'sotien_so'] ? \`<span style="color:#10b981; font-weight:bold; background:#d1fae5; padding:4px 8px; border-radius:6px;">\${item[prefix + 'sotien_so']}</span>\` : \`<span style="color:#64748b;">\${item[prefix + 'lydo'] || item[prefix + 'bennhan'] || ''}</span>\`;
                    
                    let canEdit = currentUser.role === 'admin' || (currentUser.perms && currentUser.perms.includes('edit_archive') && currentUser.perms.includes(type));
                    let actionBtn = canEdit ? \`<button onclick="reopenData('\${type}', '\${item[prefix + 'sophieu']}')" class="btn-modern" style="background:#3b82f6; color:white; padding:6px 12px; font-size:13px; margin-right:5px;">Sửa</button> <button onclick="deleteRecord('\${type}', '\${item[prefix + 'sophieu']}')" class="btn-modern" style="background:#ef4444; color:white; padding:6px 12px; font-size:13px;">Xóa</button>\` : \`<span style="color:#94a3b8; font-style:italic; font-size:13px; padding:6px 12px; background:#f1f5f9; border-radius:5px;">Chỉ xem</span>\`;

                    return \`<tr><td style="color:#64748b; text-align:center;">\${index + 1}</td><td><strong style="color:#0f172a;">\${item[prefix + 'sophieu']}</strong><br><small style="color:#94a3b8;">\${item.time}</small></td><td style="font-weight:500;">\${col3}</td><td>\${col4}</td><td>\${actionBtn}</td></tr>\`
                }).join('');
                let th4 = type === 'bangiao' ? 'Bên nhận' : (['dexuat','xuat','nhap'].includes(type) ? 'Lý do' : 'Số tiền');
                contentArea.innerHTML = \`<table class="data-table"><tr><th width="5%" style="text-align:center;">STT</th><th width="20%">Số Phiếu</th><th width="35%">\${personTitle}</th><th width="20%">\${th4}</th><th width="20%">Thao tác</th></tr>\` + rows + \`</table>\`;
            } else { contentArea.innerHTML = '<p style="color:#64748b; font-style:italic;">Trống</p>'; }
        }

        window.reopenData = function(type, soPhieu) {
            let list = getSafeJSON('danhSach_' + type, []);
            let prefix = type === 'thu' ? 'pt_' : (type === 'chi' ? 'pc_' : (type === 'dexuat' ? 'dx_' : (type === 'thanhtoan' ? 'tt_' : (type === 'bangiao' ? 'bg_' : (type === 'nhap' ? 'nk_' : 'xk_')))));
            let data = list.find(item => item[prefix + 'sophieu'] === soPhieu);
            if(data) {
                let activeInputs = type === 'thu' ? inputsThu : (type === 'chi' ? inputsChi : (type === 'dexuat' ? inputsDexuat : (type === 'thanhtoan' ? inputsThanhtoan : (type === 'bangiao' ? inputsBangiao : (type === 'nhap' ? inputsNhap : inputsXuat)))));
                activeInputs.forEach(id => { if(document.getElementById(id)) document.getElementById(id).value = data[id] || ''; });

                if(type === 'dexuat' && data['dx_table_json']) {
                    try {
                        let arr = JSON.parse(data['dx_table_json']);
                        document.querySelector('#dx_table tbody').innerHTML = '';
                        arr.forEach(item => addDxRow(item.nd, item.sl, item.gc));
                        if(arr.length === 0) addDxRow();
                    } catch(e){}
                }

                if(type === 'thanhtoan' && data['tt_items_json']) {
                    try {
                        let arr = JSON.parse(data['tt_items_json']);
                        document.getElementById('tt_items_container').innerHTML = '';
                        arr.forEach(item => addTtRow(item));
                        if(arr.length === 0) addTtRow();
                    } catch(e){}
                    document.getElementById('tt_txt_kinhgui').innerText = data['tt_kinhgui'] || '.........................';
                    document.getElementById('tt_txt_veviec').innerText = data['tt_veviec'] || '.........................';
                }

                if(type === 'bangiao' && data['bg_table_json']) {
                    try {
                        let arr = JSON.parse(data['bg_table_json']);
                        document.querySelector('#bg_table tbody').innerHTML = '';
                        arr.forEach(item => addBgRow(item.nd));
                        if(arr.length === 0) addBgRow();
                    } catch(e){}
                }

                if(type === 'xuat' && data['xk_table_json']) {
                    try {
                        let arr = JSON.parse(data['xk_table_json']);
                        document.querySelector('#xk_table tbody').innerHTML = '';
                        arr.forEach(item => addXkRow(item.nd, item.sl, item.gc));
                        if(arr.length === 0) addXkRow();
                        calcXkTotal();
                    } catch(e){}
                }
                
                if(type === 'nhap' && data['nk_table_json']) {
                    try {
                        let arr = JSON.parse(data['nk_table_json']);
                        document.querySelector('#nk_table tbody').innerHTML = '';
                        arr.forEach(item => addNkRow(item.nd, item.sl, item.gc));
                        if(arr.length === 0) addNkRow();
                        calcNkTotal();
                    } catch(e){}
                }

                showTab(type, true);
                if(type === 'nhap') toggleNhapView('doc');
                document.getElementById('edit-back-bar').style.display = 'flex';
                updateAllDots();
            }
        }

        window.deleteRecord = function(type, soPhieu) {
            if(!confirm("Xóa phiếu này khỏi hệ thống và máy chủ?")) return;
            let list = getSafeJSON('danhSach_' + type, []);
            let prefix = type === 'thu' ? 'pt_' : (type === 'chi' ? 'pc_' : (type === 'dexuat' ? 'dx_' : (type === 'thanhtoan' ? 'tt_' : (type === 'bangiao' ? 'bg_' : (type === 'nhap' ? 'nk_' : 'xk_')))));
            
            let itemToDelete = list.find(item => item[prefix + 'sophieu'] === soPhieu);
            
            if (type === 'xuat' && itemToDelete) {
                let tonkho = getSafeJSON('vtf_tonkho', []);
                let itemsArr = [];
                try { itemsArr = JSON.parse(itemToDelete.xk_table_json || '[]'); } catch(e){}
                itemsArr.forEach(i => {
                    let name = cleanItemName(i.nd);
                    let sl = parseFloat(i.sl) || 0;
                    let tkItem = tonkho.find(x => x.name === name);
                    if(tkItem) {
                        if(itemToDelete.status === 'cho_nhap') tkItem.xe -= sl;
                        else if (itemToDelete.status === 'da_nhap') tkItem.da_xuat -= sl;
                    }
                });
                tonkho = enforceInventoryMath(tonkho);
                localStorage.setItem('vtf_tonkho', JSON.stringify(tonkho));
            }

            if (type === 'nhap' && itemToDelete) {
                let tonkho = getSafeJSON('vtf_tonkho', []);
                let itemsArr = [];
                try { itemsArr = JSON.parse(itemToDelete.nk_table_json || '[]'); } catch(e){}
                itemsArr.forEach(i => {
                    let name = cleanItemName(i.nd);
                    let sl = parseFloat(i.sl) || 0;
                    let tkItem = tonkho.find(x => x.name === name);
                    if(tkItem) { tkItem.tong -= sl; }
                });
                tonkho = enforceInventoryMath(tonkho);
                localStorage.setItem('vtf_tonkho', JSON.stringify(tonkho));
            }

            list = list.filter(item => item[prefix + 'sophieu'] !== soPhieu);
            localStorage.setItem('danhSach_' + type, JSON.stringify(list));
            
            let paramObj = { formType: type, action: 'DELETE' };
            paramObj[prefix+'sophieu'] = soPhieu;
            fetch(scriptURL, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(paramObj) });
            viewArchive(type);
        }

        // BỘ DỊCH SỐ THÀNH CHỮ CHUẨN XÁC, CHỐNG UNDEFINED
        window.docSoTien = function(so) {
            if (so === 0 || isNaN(so)) return "";
            let words = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
            let blocks = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ", "tỷ tỷ"];
            
            function readGroup(n, full) {
                let str = "";
                let hundred = Math.floor(n / 100);
                let remainder = n % 100;
                let ten = Math.floor(remainder / 10);
                let unit = remainder % 10;

                if (full || hundred > 0) {
                    str += words[hundred] + " trăm ";
                    if (ten === 0 && unit > 0) str += "lẻ ";
                }
                
                if (ten === 1) str += "mười ";
                else if (ten > 1) str += words[ten] + " mươi ";
                
                if (ten > 0 && unit === 1) str += "mốt ";
                else if (ten > 0 && unit === 5) str += "lăm ";
                else if (unit > 0) str += words[unit] + " ";
                
                return str.trim();
            }

            let str = "";
            let i = 0;
            while (so > 0) {
                let group = so % 1000;
                so = Math.floor(so / 1000);
                if (group > 0) {
                    let groupStr = readGroup(group, so > 0 || i === 0);
                    str = groupStr + " " + blocks[i] + " " + str;
                } else if (i === 3 && str.length > 0) { 
                    str = blocks[i] + " " + str;
                }
                i++;
            }
            str = str.replace(/\\s+/g, ' ').trim();
            return str.charAt(0).toUpperCase() + str.slice(1) + " đồng chẵn.";
        }

        // HÀM XỬ LÝ TIỀN TỆ MỚI: BẢO VỆ CON TRỎ CHUỘT
        window.handleMoneyInput = function(input, type) {
            let prefix = type === 'thu' ? 'pt_' : (type === 'chi' ? 'pc_' : 'tt_');
            
            // Xóa tất cả các ký tự không phải số
            let rawNum = input.value.replace(/\\D/g, '').substring(0, 15);
            
            if (rawNum !== "") {
                // Định dạng chuỗi với dấu chấm
                let formatted = rawNum.replace(/\\B(?=(\\d{3})+(?!\\d))/g, ".");
                
                let oldVal = input.value;
                let cursorPos = input.selectionStart;
                
                if (oldVal !== formatted) {
                    // Đếm số dấu chấm đứng trước con trỏ chuột
                    let dotsBefore = (oldVal.substring(0, cursorPos).match(/\\./g) || []).length;
                    // Vị trí con trỏ nếu không có dấu chấm
                    let pureDigitPos = cursorPos - dotsBefore;
                    
                    input.value = formatted;
                    
                    // Tính lại vị trí con trỏ mới
                    let count = 0;
                    let newCursorPos = 0;
                    for (let i = 0; i < formatted.length; i++) {
                        if (formatted[i] !== '.') count++;
                        if (count === pureDigitPos) {
                            newCursorPos = i + 1;
                            break;
                        }
                    }
                    if (pureDigitPos === 0) newCursorPos = 0;
                    input.setSelectionRange(newCursorPos, newCursorPos);
                }
                
                let num = parseInt(rawNum, 10);
                let chu = docSoTien(num);
                
                let chuEl = document.getElementById(prefix + 'sotien_chu');
                if (chuEl) chuEl.value = chu;
                
                let danhanChu = document.getElementById(prefix + 'danhan_chu');
                if(danhanChu) danhanChu.value = chu;
                
                let danhanSo = document.getElementById(prefix + 'danhan_so');
                if(danhanSo) danhanSo.value = formatted;
                
            } else {
                input.value = "";
                let chuEl = document.getElementById(prefix + 'sotien_chu');
                if (chuEl) chuEl.value = "";
                let danhanChu = document.getElementById(prefix + 'danhan_chu');
                if(danhanChu) danhanChu.value = "";
                let danhanSo = document.getElementById(prefix + 'danhan_so');
                if(danhanSo) danhanSo.value = "";
            }
            updateAllDots();
        }

        try { updateSuggestions(); } catch(e) { console.error(e); }

      </script>
    </body>
    </html>
  `)
})

export default app
