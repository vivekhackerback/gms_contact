<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GMS School Contacts - Web Management Portal</title>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  
  <!-- Bootstrap 5.3 CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <!-- Bootstrap Icons -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  
  <!-- DataTables 2.x Bootstrap 5 CSS -->
  <link rel="stylesheet" href="https://cdn.datatables.net/2.0.8/css/dataTables.bootstrap5.min.css">
  <link rel="stylesheet" href="https://cdn.datatables.net/buttons/3.0.2/css/buttons.bootstrap5.min.css">
  <link rel="stylesheet" href="https://cdn.datatables.net/responsive/3.0.2/css/responsive.bootstrap5.min.css">
  
  <!-- SweetAlert2 for rich alerts -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">

  <style>
    :root {
      --primary: #0284c7;
      --primary-dark: #0369a1;
      --primary-light: #e0f2fe;
      --sidebar-bg: #0f172a;
      --card-bg: #ffffff;
      --body-bg: #f8fafc;
      --border-color: #e2e8f0;
      --text-main: #0f172a;
      --text-muted: #64748b;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--body-bg);
      color: var(--text-main);
      overflow-x: hidden;
    }

    h1, h2, h3, h4, h5, h6, .brand-font {
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
    }

    /* Navbar */
    .top-nav {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .brand-icon {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background: linear-gradient(135deg, #0284c7, #38bdf8);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 22px;
    }

    /* Counter Cards */
    .stat-card {
      background: #ffffff;
      border-radius: 14px;
      padding: 18px 20px;
      border: 1px solid var(--border-color);
      box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
      transition: all 0.25s ease;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }
    .stat-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 25px rgba(2, 132, 199, 0.12);
      border-color: #bae6fd;
    }
    .stat-card.active-filter {
      border-color: var(--primary);
      background: #f0f9ff;
    }
    .stat-card::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: var(--card-color, var(--primary));
    }
    .stat-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      background: var(--icon-bg, #e0f2fe);
      color: var(--icon-color, #0284c7);
    }
    .stat-count {
      font-size: 26px;
      font-weight: 800;
      line-height: 1;
      margin-bottom: 4px;
    }
    .stat-label {
      font-size: 13px;
      color: var(--text-muted);
      font-weight: 600;
    }

    /* Main Table Container */
    .table-container {
      background: #ffffff;
      border-radius: 16px;
      padding: 24px;
      border: 1px solid var(--border-color);
      box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03);
    }

    /* Custom Role Badges */
    .role-badge {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 4px 10px;
      border-radius: 20px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .badge-student { background: #E0F2FE; color: #0284C7; }
    .badge-parent { background: #FEF3C7; color: #B45309; }
    .badge-teacher { background: #DCFCE7; color: #15803D; }
    .badge-staff { background: #F3E8FF; color: #7E22CE; }
    .badge-driver { background: #FFEDD5; color: #C2410C; }
    .badge-management { background: #FCE7F3; color: #BE185D; }
    .badge-other { background: #F1F5F9; color: #475569; }

    /* Action Buttons in Table */
    .btn-action {
      width: 32px;
      height: 32px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      font-size: 14px;
      transition: all 0.15s ease;
    }

    /* Drag & Drop Upload Zone */
    .upload-zone {
      border: 2px dashed #93c5fd;
      background: #f8fafc;
      border-radius: 14px;
      padding: 35px 20px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .upload-zone:hover, .upload-zone.dragover {
      border-color: #0284c7;
      background: #f0f9ff;
    }

    /* Modal Styling */
    .modal-content {
      border-radius: 16px;
      border: none;
      box-shadow: 0 20px 50px rgba(15, 23, 42, 0.2);
    }
    .modal-header {
      border-bottom: 1px solid var(--border-color);
      padding: 18px 24px;
      background: #f8fafc;
      border-top-left-radius: 16px;
      border-top-right-radius: 16px;
    }
    .modal-body {
      padding: 24px;
    }
    .modal-footer {
      border-top: 1px solid var(--border-color);
      padding: 16px 24px;
      background: #f8fafc;
      border-bottom-left-radius: 16px;
      border-bottom-right-radius: 16px;
    }

    /* DataTables Enhancements */
    table.dataTable thead th {
      background-color: #f8fafc;
      color: #475569;
      font-weight: 700;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid var(--border-color) !important;
    }
    .dt-buttons .btn {
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      padding: 6px 14px;
    }

    .call-btn {
      color: #0284c7;
      background: #e0f2fe;
      border: none;
      padding: 4px 10px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 12px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .wa-btn {
      color: #15803d;
      background: #dcfce7;
      border: none;
      padding: 4px 10px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 12px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .call-btn:hover { background: #bae6fd; color: #0369a1; }
    .wa-btn:hover { background: #bbf7d0; color: #166534; }
  </style>
</head>
<body>

  <!-- Top Navigation Header -->
  <nav class="navbar navbar-dark top-nav py-3">
    <div class="container-fluid px-lg-5">
      <div class="d-flex align-items-center gap-3">
        <div class="brand-icon shadow-sm">
          <i class="bi bi-mortarboard-fill"></i>
        </div>
        <div>
          <h4 class="text-white mb-0 brand-font">GMS School Contacts</h4>
          <small class="text-white-50">Web Administration & Excel Management Portal</small>
        </div>
      </div>

      <div class="d-flex align-items-center gap-2 mt-3 mt-md-0">
        <!-- Live DB Indicator -->
        <span class="badge bg-success bg-opacity-25 text-success border border-success border-opacity-25 px-3 py-2 rounded-pill d-none d-sm-inline-flex align-items-center gap-2">
          <span class="spinner-grow spinner-grow-sm text-success" role="status" style="width: 8px; height: 8px;"></span>
          MySQL Connected: <b class="fw-semibold">u109731178_gms_contact_db</b>
        </span>

        <!-- Action Buttons -->
        <button class="btn btn-outline-light btn-sm px-3 py-2 rounded-3 d-flex align-items-center gap-2" id="btnExportExcel">
          <i class="bi bi-file-earmark-excel-fill text-success fs-6"></i>
          <span>Export Excel</span>
        </button>

        <button class="btn btn-primary btn-sm px-3 py-2 rounded-3 d-flex align-items-center gap-2" data-bs-toggle="modal" data-bs-target="#importExcelModal">
          <i class="bi bi-cloud-arrow-up-fill fs-6"></i>
          <span>Import Excel</span>
        </button>

        <button class="btn btn-success btn-sm px-3 py-2 rounded-3 d-flex align-items-center gap-2 shadow-sm" onclick="openAddContactModal()">
          <i class="bi bi-person-plus-fill fs-6"></i>
          <span>Add Contact</span>
        </button>
      </div>
    </div>
  </nav>

  <!-- Main Container -->
  <div class="container-fluid px-lg-5 py-4">

    <!-- KPI / Statistics Cards Grid -->
    <div class="row g-3 mb-4" id="statsCardsContainer">
      <!-- Total Contacts -->
      <div class="col-6 col-md-4 col-xl">
        <div class="stat-card" style="--card-color: #0284c7; --icon-bg: #e0f2fe; --icon-color: #0284c7;" onclick="filterTableByRole('all', this)">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <div class="stat-count text-dark" id="statTotal">--</div>
              <div class="stat-label">Total Contacts</div>
            </div>
            <div class="stat-icon"><i class="bi bi-people-fill"></i></div>
          </div>
        </div>
      </div>

      <!-- Students -->
      <div class="col-6 col-md-4 col-xl">
        <div class="stat-card" style="--card-color: #0284c7; --icon-bg: #e0f2fe; --icon-color: #0284c7;" onclick="filterTableByRole('student', this)">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <div class="stat-count text-primary" id="statStudents">--</div>
              <div class="stat-label">Students</div>
            </div>
            <div class="stat-icon"><i class="bi bi-backpack-fill"></i></div>
          </div>
        </div>
      </div>

      <!-- Parents -->
      <div class="col-6 col-md-4 col-xl">
        <div class="stat-card" style="--card-color: #d97706; --icon-bg: #fef3c7; --icon-color: #d97706;" onclick="filterTableByRole('parent', this)">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <div class="stat-count text-warning" id="statParents">--</div>
              <div class="stat-label">Parents</div>
            </div>
            <div class="stat-icon"><i class="bi bi-person-hearts"></i></div>
          </div>
        </div>
      </div>

      <!-- Teachers -->
      <div class="col-6 col-md-4 col-xl">
        <div class="stat-card" style="--card-color: #16a34a; --icon-bg: #dcfce7; --icon-color: #16a34a;" onclick="filterTableByRole('teacher', this)">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <div class="stat-count text-success" id="statTeachers">--</div>
              <div class="stat-label">Teachers</div>
            </div>
            <div class="stat-icon"><i class="bi bi-person-video3"></i></div>
          </div>
        </div>
      </div>

      <!-- Staff -->
      <div class="col-6 col-md-4 col-xl">
        <div class="stat-card" style="--card-color: #9333ea; --icon-bg: #f3e8ff; --icon-color: #9333ea;" onclick="filterTableByRole('staff', this)">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <div class="stat-count" style="color: #9333ea;" id="statStaff">--</div>
              <div class="stat-label">Staff</div>
            </div>
            <div class="stat-icon"><i class="bi bi-briefcase-fill"></i></div>
          </div>
        </div>
      </div>

      <!-- Drivers -->
      <div class="col-6 col-md-4 col-xl">
        <div class="stat-card" style="--card-color: #ea580c; --icon-bg: #ffedd5; --icon-color: #ea580c;" onclick="filterTableByRole('driver', this)">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <div class="stat-count text-danger" id="statDrivers">--</div>
              <div class="stat-label">Drivers</div>
            </div>
            <div class="stat-icon"><i class="bi bi-bus-front-fill"></i></div>
          </div>
        </div>
      </div>

      <!-- Management -->
      <div class="col-6 col-md-4 col-xl">
        <div class="stat-card" style="--card-color: #db2777; --icon-bg: #fce7f3; --icon-color: #db2777;" onclick="filterTableByRole('management', this)">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <div class="stat-count" style="color: #db2777;" id="statManagement">--</div>
              <div class="stat-label">Management</div>
            </div>
            <div class="stat-icon"><i class="bi bi-award-fill"></i></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Contacts DataTable Section -->
    <div class="table-container">
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h4 class="mb-1 text-dark">Contact Directory</h4>
          <p class="text-muted small mb-0">Search, filter, edit, or export school records in real-time.</p>
        </div>

        <!-- Filter Buttons -->
        <div class="btn-group btn-group-sm flex-wrap shadow-sm rounded-pill p-1 bg-light border" role="group" id="roleFilterButtonGroup">
          <button type="button" class="btn btn-primary rounded-pill px-3 active" onclick="filterTableByRole('all', this)">All</button>
          <button type="button" class="btn btn-light rounded-pill px-3" onclick="filterTableByRole('student', this)">Students</button>
          <button type="button" class="btn btn-light rounded-pill px-3" onclick="filterTableByRole('parent', this)">Parents</button>
          <button type="button" class="btn btn-light rounded-pill px-3" onclick="filterTableByRole('teacher', this)">Teachers</button>
          <button type="button" class="btn btn-light rounded-pill px-3" onclick="filterTableByRole('staff', this)">Staff</button>
          <button type="button" class="btn btn-light rounded-pill px-3" onclick="filterTableByRole('driver', this)">Drivers</button>
          <button type="button" class="btn btn-light rounded-pill px-3" onclick="filterTableByRole('management', this)">Management</button>
        </div>
      </div>

      <!-- Error Alert Banner -->
      <div id="tableErrorAlert" class="alert alert-danger d-none d-flex align-items-center justify-content-between mb-3 shadow-sm rounded-3" role="alert">
        <div class="d-flex align-items-center">
          <i class="bi bi-exclamation-triangle-fill fs-4 me-3 text-danger"></i>
          <div>
            <h6 class="alert-heading fw-bold mb-1">Failed to Load Contacts</h6>
            <div id="tableErrorMessage" class="small">An error occurred while fetching contacts from the server.</div>
          </div>
        </div>
        <button type="button" class="btn btn-outline-danger btn-sm px-3" onclick="refreshTable()">
          <i class="bi bi-arrow-clockwise me-1"></i> Retry
        </button>
      </div>

      <!-- DataTable -->
      <div class="table-responsive">
        <table id="contactsTable" class="table table-hover align-middle w-100">
          <thead>
            <tr>
              <th style="width: 50px;">#</th>
              <th>Full Name</th>
              <th>Role</th>
              <th>Mobile & Quick Connect</th>
              <th>Specific Details</th>
              <th>City / Address</th>
              <th class="text-end" style="width: 120px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <!-- Populated dynamically via AJAX -->
          </tbody>
        </table>
      </div>
    </div>

  </div>

  <!-- ====================================================================== -->
  <!-- MODAL: ADD / EDIT CONTACT -->
  <!-- ====================================================================== -->
  <div class="modal fade" id="contactModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content">
        <form id="contactForm" onsubmit="handleSaveContact(event)">
          <div class="modal-header">
            <h5 class="modal-title fw-bold" id="contactModalTitle">
              <i class="bi bi-person-plus-fill text-primary me-2"></i>Add New Contact
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <input type="hidden" id="contactId" name="id" value="">

            <!-- 1. Contact Role -->
            <div class="mb-3">
              <label class="form-label fw-semibold">Contact Category <span class="text-danger">*</span></label>
              <select class="form-select" id="contactType" name="contact_type" required onchange="handleRoleChange(this.value)">
                <option value="student">Student</option>
                <option value="parent">Parent / Guardian</option>
                <option value="teacher">Teacher / Faculty</option>
                <option value="staff">Non-Teaching Staff</option>
                <option value="driver">Driver / Transport</option>
                <option value="management">Management / Leadership</option>
                <option value="other">Other Contact</option>
              </select>
            </div>

            <!-- 2. Primary Information -->
            <div class="row g-3 mb-3">
              <div class="col-md-6">
                <label class="form-label fw-semibold">Full Name <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="fullName" name="full_name" required placeholder="e.g. Rahul Kumar">
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold">Primary Mobile Number <span class="text-danger">*</span></label>
                <input type="tel" class="form-control" id="mobileNumber" name="mobile_number" required placeholder="10-digit mobile number">
              </div>
            </div>

            <div class="row g-3 mb-3">
              <div class="col-md-4">
                <label class="form-label">Alternate Mobile</label>
                <input type="tel" class="form-control" id="altMobile" name="alternate_mobile" placeholder="Optional">
              </div>
              <div class="col-md-4">
                <label class="form-label">WhatsApp Number</label>
                <input type="tel" class="form-control" id="whatsappNumber" name="whatsapp_number" placeholder="Leave empty if same as mobile">
              </div>
              <div class="col-md-4">
                <label class="form-label">Email Address</label>
                <input type="email" class="form-control" id="email" name="email" placeholder="name@domain.com">
              </div>
            </div>

            <!-- 3. Dynamic Role-Specific Fields Container -->
            <div class="card bg-light border p-3 mb-3" id="roleFieldsContainer">
              <h6 class="fw-bold mb-3 text-primary d-flex align-items-center gap-2">
                <i class="bi bi-sliders"></i> <span id="roleSectionTitle">Student Information</span>
              </h6>

              <!-- Student Fields -->
              <div id="studentFields">
                <div class="row g-3">
                  <div class="col-md-4">
                    <label class="form-label small fw-semibold">Admission Number</label>
                    <input type="text" class="form-control form-control-sm" id="studentAdmission" name="admission_number" placeholder="e.g. ADM1024">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label small fw-semibold">Class</label>
                    <input type="text" class="form-control form-control-sm" id="studentClass" name="student_class" placeholder="e.g. 5, 8, 10">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label small fw-semibold">Section</label>
                    <input type="text" class="form-control form-control-sm" id="studentSection" name="student_section" placeholder="e.g. A, B">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label small fw-semibold">Father's Name</label>
                    <input type="text" class="form-control form-control-sm" id="studentFatherName" name="student_father_name" placeholder="Father or Guardian Name">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label small fw-semibold">Bus Route (Optional)</label>
                    <input type="text" class="form-control form-control-sm" id="studentBusRoute" name="bus_route" placeholder="e.g. Route 4 - City Center">
                  </div>
                </div>
              </div>

              <!-- Parent Fields -->
              <div id="parentFields" class="d-none">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label small fw-semibold">Relationship with Student</label>
                    <select class="form-select form-select-sm" id="parentRelationship" name="relationship_with_student">
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Guardian">Guardian</option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label small fw-semibold">Occupation</label>
                    <input type="text" class="form-control form-control-sm" id="parentOccupation" name="occupation" placeholder="e.g. Business, Engineer">
                  </div>
                </div>
              </div>

              <!-- Teacher Fields -->
              <div id="teacherFields" class="d-none">
                <div class="row g-3">
                  <div class="col-md-4">
                    <label class="form-label small fw-semibold">Teacher Employee ID</label>
                    <input type="text" class="form-control form-control-sm" id="teacherEmpId" name="teacher_employee_id" placeholder="e.g. TCH102">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label small fw-semibold">Subject / Department</label>
                    <input type="text" class="form-control form-control-sm" id="teacherSubject" name="department_subject" placeholder="e.g. Mathematics, Science">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label small fw-semibold">Designation</label>
                    <input type="text" class="form-control form-control-sm" id="teacherDesignation" name="teacher_designation" placeholder="e.g. Senior Teacher, HOD">
                  </div>
                </div>
              </div>

              <!-- Staff Fields -->
              <div id="staffFields" class="d-none">
                <div class="row g-3">
                  <div class="col-md-4">
                    <label class="form-label small fw-semibold">Staff Employee ID</label>
                    <input type="text" class="form-control form-control-sm" id="staffEmpId" name="staff_employee_id" placeholder="e.g. STF201">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label small fw-semibold">Designation</label>
                    <input type="text" class="form-control form-control-sm" id="staffDesignation" name="staff_designation" placeholder="e.g. Accountant, Librarian">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label small fw-semibold">Department</label>
                    <input type="text" class="form-control form-control-sm" id="staffDept" name="staff_department" placeholder="e.g. Accounts, Admin">
                  </div>
                </div>
              </div>

              <!-- Driver Fields -->
              <div id="driverFields" class="d-none">
                <div class="row g-3">
                  <div class="col-md-4">
                    <label class="form-label small fw-semibold">Driver ID</label>
                    <input type="text" class="form-control form-control-sm" id="driverId" name="driver_id" placeholder="e.g. DRV04">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label small fw-semibold">Vehicle Number</label>
                    <input type="text" class="form-control form-control-sm" id="driverVehicle" name="vehicle_number" placeholder="e.g. BR-24-EA-5541">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label small fw-semibold">Route Covered</label>
                    <input type="text" class="form-control form-control-sm" id="driverRoute" name="driver_route" placeholder="e.g. Route 4 Campus Express">
                  </div>
                </div>
              </div>

              <!-- Management Fields -->
              <div id="managementFields" class="d-none">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label small fw-semibold">Designation</label>
                    <input type="text" class="form-control form-control-sm" id="mgmtDesignation" name="management_designation" placeholder="e.g. Principal, Director, Trustee">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label small fw-semibold">Department</label>
                    <input type="text" class="form-control form-control-sm" id="mgmtDept" name="management_department" placeholder="e.g. Administration, Academic Board">
                  </div>
                </div>
              </div>
            </div>

            <!-- 4. Address Details -->
            <div class="row g-3 mb-3">
              <div class="col-md-6">
                <label class="form-label">Address</label>
                <input type="text" class="form-control" id="address" name="address" placeholder="Street / Area">
              </div>
              <div class="col-md-3">
                <label class="form-label">City</label>
                <input type="text" class="form-control" id="city" name="city" placeholder="e.g. Rohtas, Patna">
              </div>
              <div class="col-md-3">
                <label class="form-label">Pincode</label>
                <input type="text" class="form-control" id="pincode" name="pincode" placeholder="6-digit">
              </div>
            </div>

            <!-- Notes -->
            <div class="mb-2">
              <label class="form-label">Notes & Remarks</label>
              <textarea class="form-control" id="notes" name="notes" rows="2" placeholder="Any specific remarks or designations..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
            <button type="submit" class="btn btn-primary px-4 fw-semibold" id="btnSaveContact">
              <i class="bi bi-check-lg me-1"></i>Save Contact
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- ====================================================================== -->
  <!-- MODAL: VIEW CONTACT DETAILS -->
  <!-- ====================================================================== -->
  <div class="modal fade" id="viewContactModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <div class="d-flex align-items-center gap-2">
            <span id="viewRoleBadge" class="role-badge">STUDENT</span>
            <h5 class="modal-title mb-0 fw-bold" id="viewFullName">Contact Details</h5>
          </div>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <!-- Primary Actions -->
          <div class="d-flex gap-2 mb-4 justify-content-center">
            <a href="#" id="viewCallLink" class="call-btn px-3 py-2 rounded-pill shadow-sm">
              <i class="bi bi-telephone-fill"></i> Call Now
            </a>
            <a href="#" id="viewWaLink" target="_blank" class="wa-btn px-3 py-2 rounded-pill shadow-sm">
              <i class="bi bi-whatsapp"></i> WhatsApp
            </a>
          </div>

          <!-- Contact Details Table -->
          <table class="table table-sm table-bordered">
            <tbody id="viewDetailsBody">
              <!-- Dynamically populated -->
            </tbody>
          </table>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-light" data-bs-dismiss="modal">Close</button>
          <button type="button" class="btn btn-primary" id="btnEditFromView">
            <i class="bi bi-pencil-square me-1"></i> Edit Contact
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- ====================================================================== -->
  <!-- MODAL: IMPORT EXCEL (MS EXCEL & CSV) -->
  <!-- ====================================================================== -->
  <div class="modal fade" id="importExcelModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-xl modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <div>
            <h5 class="modal-title fw-bold">
              <i class="bi bi-file-earmark-spreadsheet-fill text-success me-2"></i>Import Contacts from MS Excel
            </h5>
            <small class="text-muted">Upload an Excel (.xlsx / .xls) or CSV sheet to batch-add school contacts</small>
          </div>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          
          <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3 p-3 bg-light rounded-3 border">
            <div>
              <span class="fw-bold text-dark">Need the correct column format?</span>
              <p class="small text-muted mb-0">Download our pre-formatted template with sample records for Students, Teachers, Parents, and Drivers.</p>
            </div>
            <button class="btn btn-outline-success btn-sm fw-semibold d-inline-flex align-items-center gap-2" onclick="downloadSampleExcel()">
              <i class="bi bi-download"></i> Download Sample Excel (.xlsx)
            </button>
          </div>

          <!-- Upload Drop Zone -->
          <div class="upload-zone mb-3" id="dropZone" onclick="document.getElementById('excelFileInput').click()">
            <input type="file" id="excelFileInput" accept=".xlsx, .xls, .csv" class="d-none" onchange="handleExcelFileSelect(this.files[0])">
            <i class="bi bi-cloud-arrow-up text-primary fs-1 mb-2 d-block"></i>
            <h5 class="fw-bold mb-1">Click to browse or Drag & Drop Excel file here</h5>
            <p class="text-muted small mb-0">Supported formats: Microsoft Excel (.xlsx, .xls) and CSV (.csv)</p>
          </div>

          <!-- Preview Container (Hidden initially) -->
          <div id="importPreviewSection" class="d-none">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="fw-bold text-dark">Parsed Rows Preview (<span id="parsedRowCount">0</span> contacts detected):</span>
              <span class="badge bg-primary rounded-pill px-3 py-2" id="readyCountBadge">Ready to import</span>
            </div>
            <div class="table-responsive border rounded-3 mb-3" style="max-height: 280px;">
              <table class="table table-sm table-striped table-hover mb-0" id="previewTable">
                <thead class="table-light sticky-top">
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Mobile</th>
                    <th>Role</th>
                    <th>Admission / ID</th>
                    <th>Class / Dept</th>
                    <th>City</th>
                  </tr>
                </thead>
                <tbody id="previewTableBody">
                  <!-- Populated from Excel parser -->
                </tbody>
              </table>
            </div>
          </div>

        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-success px-4 fw-semibold" id="btnConfirmImport" disabled onclick="executeBatchImport()">
            <i class="bi bi-cloud-check-fill me-1"></i> Confirm & Import to Database
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- jQuery & Bootstrap 5 JS -->
  <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

  <!-- DataTables 2.x JS -->
  <script src="https://cdn.datatables.net/2.0.8/js/dataTables.min.js"></script>
  <script src="https://cdn.datatables.net/2.0.8/js/dataTables.bootstrap5.min.js"></script>
  <script src="https://cdn.datatables.net/responsive/3.0.2/js/dataTables.responsive.min.js"></script>
  <script src="https://cdn.datatables.net/responsive/3.0.2/js/responsive.bootstrap5.min.js"></script>

  <!-- DataTables Buttons & JSZip for Excel HTML5 Export -->
  <script src="https://cdn.datatables.net/buttons/3.0.2/js/dataTables.buttons.min.js"></script>
  <script src="https://cdn.datatables.net/buttons/3.0.2/js/buttons.bootstrap5.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
  <script src="https://cdn.datatables.net/buttons/3.0.2/js/buttons.html5.min.js"></script>
  <script src="https://cdn.datatables.net/buttons/3.0.2/js/buttons.print.min.js"></script>

  <!-- SheetJS (xlsx.full.min.js) for reading & writing Excel files on client -->
  <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>

  <!-- SweetAlert2 -->
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

  <script>
    let dataTableInstance = null;
    let cachedContacts = [];
    let parsedExcelRows = [];
    let currentFilterRole = 'all';

    $(document).ready(function() {
      initDataTable();
      loadStats();
      setupDragAndDrop();

      // Excel export button in top nav
      $('#btnExportExcel').on('click', function() {
        exportAllContactsToExcel();
      });
    });

    /**
     * Show table error banner
     */
    function showTableError(msg) {
      $('#tableErrorMessage').text(msg || 'Unable to retrieve contacts from server. Please check database connection.');
      $('#tableErrorAlert').removeClass('d-none');
    }

    /**
     * Initialize DataTable
     */
    function initDataTable() {
      // Suppress default DataTables browser alert dialogs (TN/7)
      $.fn.dataTable.ext.errMode = 'none';

      dataTableInstance = $('#contactsTable').DataTable({
        ajax: {
          url: 'actions.php?action=list',
          dataSrc: function(json) {
            if (!json || json.success === false) {
              const msg = (json && json.error) ? json.error : 'Failed to retrieve contacts from database.';
              showTableError(msg);
              return [];
            }
            $('#tableErrorAlert').addClass('d-none');
            cachedContacts = json.data || [];
            return cachedContacts;
          },
          error: function(xhr, error, thrown) {
            let errMsg = 'Network or server error (' + xhr.status + ': ' + (thrown || xhr.statusText || 'Offline') + ')';
            try {
              const res = JSON.parse(xhr.responseText);
              if (res && res.error) errMsg = res.error;
            } catch(e) {}
            showTableError(errMsg);
          }
        },
        columns: [
          {
            data: null,
            render: function(data, type, row, meta) {
              return `<span class="text-muted fw-bold small">${meta.row + 1}</span>`;
            }
          },
          {
            data: 'full_name',
            render: function(data, type, row) {
              return `
                <div class="fw-bold text-dark fs-6">${data}</div>
                <small class="text-muted">${row.notes ? row.notes.substring(0, 45) + (row.notes.length > 45 ? '...' : '') : ''}</small>
              `;
            }
          },
          {
            data: 'contact_type',
            render: function(data) {
              const badgeClass = 'badge-' + (data || 'other');
              return `<span class="role-badge ${badgeClass}"><i class="bi bi-dot fs-6"></i>${(data || 'other').toUpperCase()}</span>`;
            }
          },
          {
            data: 'mobile_number',
            render: function(data, type, row) {
              const wa = row.whatsapp_number || data;
              return `
                <div class="d-flex align-items-center gap-2 mb-1">
                  <span class="fw-semibold font-monospace">${data}</span>
                </div>
                <div class="d-flex gap-1">
                  <a href="tel:${data}" class="call-btn"><i class="bi bi-telephone-fill"></i> Call</a>
                  <a href="https://wa.me/91${wa}" target="_blank" class="wa-btn"><i class="bi bi-whatsapp"></i> Chat</a>
                </div>
              `;
            }
          },
          {
            data: null,
            render: function(data, type, row) {
              const t = row.contact_type;
              if (t === 'student') {
                return `
                  <div><b>Class:</b> ${row.student_class || '-'}-${row.student_section || 'A'}</div>
                  <small class="text-muted">Adm: ${row.admission_number || '-'}</small>
                `;
              } else if (t === 'teacher') {
                return `
                  <div><b>Sub:</b> ${row.department_subject || '-'}</div>
                  <small class="text-muted">ID: ${row.teacher_employee_id || '-'}</small>
                `;
              } else if (t === 'parent') {
                const kids = row.children || [];
                return `
                  <div><b>Relation:</b> ${row.relationship_with_student || 'Parent'}</div>
                  <small class="text-muted">Kids: ${kids.map(k => k.student_name).join(', ') || '-'}</small>
                `;
              } else if (t === 'staff') {
                return `
                  <div><b>${row.staff_designation || 'Staff'}</b></div>
                  <small class="text-muted">${row.staff_department || 'Admin'}</small>
                `;
              } else if (t === 'driver') {
                return `
                  <div><b>Bus:</b> ${row.vehicle_number || '-'}</div>
                  <small class="text-muted">${row.driver_route || 'Route'}</small>
                `;
              } else if (t === 'management') {
                return `
                  <div><b>${row.management_designation || 'Director'}</b></div>
                  <small class="text-muted">${row.management_department || 'Management'}</small>
                `;
              }
              return '-';
            }
          },
          {
            data: null,
            render: function(data, type, row) {
              const city = row.city || '';
              const addr = row.address || '';
              return `<div>${city ? `<span class="badge bg-light text-dark border me-1">${city}</span>` : ''}</div>
                      <small class="text-muted text-truncate d-block" style="max-width: 140px;">${addr}</small>`;
            }
          },
          {
            data: null,
            className: 'text-end',
            orderable: false,
            render: function(data, type, row) {
              return `
                <div class="d-inline-flex gap-1">
                  <button class="btn btn-outline-info btn-action" title="View Details" onclick="viewContactDetails(${row.id})">
                    <i class="bi bi-eye"></i>
                  </button>
                  <button class="btn btn-outline-primary btn-action" title="Edit Contact" onclick="editContact(${row.id})">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-outline-danger btn-action" title="Delete Contact" onclick="deleteContactConfirm(${row.id}, '${row.full_name}')">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              `;
            }
          }
        ],
        order: [[0, 'asc']],
        pageLength: 10,
        responsive: true,
        dom: "<'row mb-3'<'col-sm-12 col-md-6 d-flex align-items-center gap-2'lB><'col-sm-12 col-md-6'f>>" +
             "<'row'<'col-sm-12'tr>>" +
             "<'row mt-3'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
        buttons: [
          {
            extend: 'excelHtml5',
            text: '<i class="bi bi-file-earmark-excel"></i> Table Excel',
            className: 'btn-outline-success btn-sm',
            title: 'School_Contacts_Directory'
          },
          {
            extend: 'csvHtml5',
            text: '<i class="bi bi-filetype-csv"></i> CSV',
            className: 'btn-outline-secondary btn-sm',
            title: 'School_Contacts_Directory'
          },
          {
            extend: 'print',
            text: '<i class="bi bi-printer"></i> Print',
            className: 'btn-outline-dark btn-sm'
          }
        ],
        language: {
          search: "_INPUT_",
          searchPlaceholder: "Search any name, mobile, admission no, subject...",
          lengthMenu: "Show _MENU_ contacts per page"
        }
      });
    }

    /**
     * Load Top Counter Statistics
     */
    function loadStats() {
      $.getJSON('actions.php?action=stats', function(res) {
        if (res.success) {
          $('#statTotal').text(res.total || 0);
          $('#statStudents').text(res.by_type.student || 0);
          $('#statParents').text(res.by_type.parent || 0);
          $('#statTeachers').text(res.by_type.teacher || 0);
          $('#statStaff').text(res.by_type.staff || 0);
          $('#statDrivers').text(res.by_type.driver || 0);
          $('#statManagement').text(res.by_type.management || 0);
        }
      });
    }

    /**
     * Filter Table by Role
     */
    function filterTableByRole(role, element) {
      currentFilterRole = role;

      // Update stat cards active style
      $('.stat-card').removeClass('active-filter');
      if (element && $(element).hasClass('stat-card')) {
        $(element).addClass('active-filter');
      }

      // Update button group style
      $('#roleFilterButtonGroup button').removeClass('btn-primary active').addClass('btn-light');
      $(`#roleFilterButtonGroup button:contains('${role === 'all' ? 'All' : capitalize(role)}')`).removeClass('btn-light').addClass('btn-primary active');

      if (role === 'all') {
        dataTableInstance.column(2).search('').draw();
      } else {
        dataTableInstance.column(2).search(role, true, false).draw();
      }
    }

    function capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Open Modal for Adding New Contact
     */
    function openAddContactModal() {
      $('#contactModalTitle').html('<i class="bi bi-person-plus-fill text-primary me-2"></i>Add New Contact');
      $('#contactForm')[0].reset();
      $('#contactId').val('');
      $('#contactType').val('student');
      handleRoleChange('student');
      const modal = new bootstrap.Modal(document.getElementById('contactModal'));
      modal.show();
    }

    /**
     * Open Modal for Editing Existing Contact
     */
    function editContact(id) {
      $.getJSON('actions.php?action=get&id=' + id, function(res) {
        if (!res.success) {
          Swal.fire('Error', res.message || 'Could not load contact', 'error');
          return;
        }
        const c = res.data;
        $('#contactModalTitle').html('<i class="bi bi-pencil-square text-primary me-2"></i>Edit Contact');
        $('#contactId').val(c.id);
        $('#contactType').val(c.contact_type);
        handleRoleChange(c.contact_type);

        $('#fullName').val(c.full_name);
        $('#mobileNumber').val(c.mobile_number);
        $('#altMobile').val(c.alternate_mobile || '');
        $('#whatsappNumber').val(c.whatsapp_number || '');
        $('#email').val(c.email || '');
        $('#address').val(c.address || '');
        $('#city').val(c.city || '');
        $('#pincode').val(c.pincode || '');
        $('#notes').val(c.notes || '');

        // Role details
        if (c.contact_type === 'student') {
          $('#studentAdmission').val(c.admission_number || '');
          $('#studentClass').val(c.student_class || '');
          $('#studentSection').val(c.student_section || '');
          $('#studentFatherName').val(c.student_father_name || '');
          $('#studentBusRoute').val(c.bus_route || '');
        } else if (c.contact_type === 'teacher') {
          $('#teacherEmpId').val(c.teacher_employee_id || '');
          $('#teacherSubject').val(c.department_subject || '');
          $('#teacherDesignation').val(c.teacher_designation || '');
        } else if (c.contact_type === 'parent') {
          $('#parentRelationship').val(c.relationship_with_student || 'Father');
          $('#parentOccupation').val(c.parent_occupation || '');
        } else if (c.contact_type === 'staff') {
          $('#staffEmpId').val(c.staff_employee_id || '');
          $('#staffDesignation').val(c.staff_designation || '');
          $('#staffDept').val(c.staff_department || '');
        } else if (c.contact_type === 'driver') {
          $('#driverId').val(c.driver_id || '');
          $('#driverVehicle').val(c.vehicle_number || '');
          $('#driverRoute').val(c.driver_route || '');
        } else if (c.contact_type === 'management') {
          $('#mgmtDesignation').val(c.management_designation || '');
          $('#mgmtDept').val(c.management_department || '');
        }

        const modal = new bootstrap.Modal(document.getElementById('contactModal'));
        modal.show();
      });
    }

    /**
     * Show / Hide Dynamic Fields based on Role Selected
     */
    function handleRoleChange(role) {
      $('#studentFields, #parentFields, #teacherFields, #staffFields, #driverFields, #managementFields').addClass('d-none');
      let title = 'Additional Information';

      if (role === 'student') {
        $('#studentFields').removeClass('d-none');
        title = 'Student Details';
      } else if (role === 'parent') {
        $('#parentFields').removeClass('d-none');
        title = 'Parent Details';
      } else if (role === 'teacher') {
        $('#teacherFields').removeClass('d-none');
        title = 'Teacher / Faculty Details';
      } else if (role === 'staff') {
        $('#staffFields').removeClass('d-none');
        title = 'Staff Details';
      } else if (role === 'driver') {
        $('#driverFields').removeClass('d-none');
        title = 'Driver & Transport Details';
      } else if (role === 'management') {
        $('#managementFields').removeClass('d-none');
        title = 'Management Details';
      }
      $('#roleSectionTitle').text(title);
    }

    /**
     * Save Contact (AJAX)
     */
    function handleSaveContact(e) {
      e.preventDefault();
      const form = document.getElementById('contactForm');
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      $('#btnSaveContact').prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span>Saving...');

      fetch('actions.php?action=save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      .then(res => res.json())
      .then(res => {
        $('#btnSaveContact').prop('disabled', false).html('<i class="bi bi-check-lg me-1"></i>Save Contact');
        if (res.success) {
          bootstrap.Modal.getInstance(document.getElementById('contactModal')).hide();
          Swal.fire({
            icon: 'success',
            title: 'Saved!',
            text: res.message || 'Contact saved successfully.',
            timer: 1600,
            showConfirmButton: false
          });
          dataTableInstance.ajax.reload(null, false);
          loadStats();
        } else {
          Swal.fire('Error', res.error || 'Failed to save contact', 'error');
        }
      })
      .catch(err => {
        $('#btnSaveContact').prop('disabled', false).html('<i class="bi bi-check-lg me-1"></i>Save Contact');
        Swal.fire('Network Error', err.message, 'error');
      });
    }

    /**
     * Delete Contact Confirmation
     */
    function deleteContactConfirm(id, name) {
      Swal.fire({
        title: 'Delete Contact?',
        text: `Are you sure you want to permanently delete "${name}" from the database?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, Delete Contact'
      }).then((result) => {
        if (result.isConfirmed) {
          $.post('actions.php?action=delete', { id: id }, function(res) {
            if (res.success) {
              Swal.fire({
                icon: 'success',
                title: 'Deleted',
                text: 'Contact removed from database.',
                timer: 1500,
                showConfirmButton: false
              });
              dataTableInstance.ajax.reload(null, false);
              loadStats();
            } else {
              Swal.fire('Error', res.error || 'Could not delete contact', 'error');
            }
          }, 'json');
        }
      });
    }

    /**
     * View Contact Full Details
     */
    function viewContactDetails(id) {
      $.getJSON('actions.php?action=get&id=' + id, function(res) {
        if (!res.success) return;
        const c = res.data;

        $('#viewFullName').text(c.full_name);
        $('#viewRoleBadge').attr('class', 'role-badge badge-' + c.contact_type).text(c.contact_type.toUpperCase());
        $('#viewCallLink').attr('href', 'tel:' + c.mobile_number);
        $('#viewWaLink').attr('href', 'https://wa.me/91' + (c.whatsapp_number || c.mobile_number));

        $('#btnEditFromView').off('click').on('click', function() {
          bootstrap.Modal.getInstance(document.getElementById('viewContactModal')).hide();
          editContact(c.id);
        });

        let rows = `
          <tr><th style="width: 35%;">Mobile:</th><td><b>${c.mobile_number}</b></td></tr>
          ${c.alternate_mobile ? `<tr><th>Alternate Mobile:</th><td>${c.alternate_mobile}</td></tr>` : ''}
          ${c.email ? `<tr><th>Email:</th><td><a href="mailto:${c.email}">${c.email}</a></td></tr>` : ''}
          ${c.address ? `<tr><th>Address:</th><td>${c.address}, ${c.city || ''} ${c.pincode || ''}</td></tr>` : ''}
        `;

        if (c.contact_type === 'student') {
          rows += `
            <tr class="table-light"><th colspan="2" class="text-primary fw-bold">Student Record</th></tr>
            <tr><th>Admission No:</th><td><b>${c.admission_number || '-'}</b></td></tr>
            <tr><th>Class & Section:</th><td>${c.student_class || '-'}-${c.student_section || 'A'}</td></tr>
            <tr><th>Father Name:</th><td>${c.student_father_name || '-'}</td></tr>
            <tr><th>Bus Route:</th><td>${c.bus_route || 'Not Enrolled'}</td></tr>
          `;
        } else if (c.contact_type === 'teacher') {
          rows += `
            <tr class="table-light"><th colspan="2" class="text-success fw-bold">Teacher Record</th></tr>
            <tr><th>Employee ID:</th><td><b>${c.teacher_employee_id || '-'}</b></td></tr>
            <tr><th>Subject / Dept:</th><td>${c.department_subject || '-'}</td></tr>
            <tr><th>Designation:</th><td>${c.teacher_designation || 'Teacher'}</td></tr>
          `;
        } else if (c.contact_type === 'parent') {
          const kids = c.children || [];
          rows += `
            <tr class="table-light"><th colspan="2" class="text-warning fw-bold">Parent Record</th></tr>
            <tr><th>Relationship:</th><td>${c.relationship_with_student || 'Parent'}</td></tr>
            <tr><th>Occupation:</th><td>${c.parent_occupation || '-'}</td></tr>
            <tr><th>Linked Children:</th><td>${kids.map(k => k.student_name + ' (' + (k.class_section || 'Student') + ')').join('<br>') || 'None'}</td></tr>
          `;
        } else if (c.contact_type === 'staff') {
          rows += `
            <tr class="table-light"><th colspan="2" class="text-purple fw-bold">Staff Record</th></tr>
            <tr><th>Employee ID:</th><td><b>${c.staff_employee_id || '-'}</b></td></tr>
            <tr><th>Designation:</th><td>${c.staff_designation || 'Staff'}</td></tr>
            <tr><th>Department:</th><td>${c.staff_department || '-'}</td></tr>
          `;
        } else if (c.contact_type === 'driver') {
          rows += `
            <tr class="table-light"><th colspan="2" class="text-danger fw-bold">Transport Record</th></tr>
            <tr><th>Driver ID:</th><td><b>${c.driver_id || '-'}</b></td></tr>
            <tr><th>Vehicle Number:</th><td>${c.vehicle_number || '-'}</td></tr>
            <tr><th>Route:</th><td>${c.driver_route || '-'}</td></tr>
          `;
        }

        if (c.notes) {
          rows += `<tr><th>Notes:</th><td class="text-muted small">${c.notes}</td></tr>`;
        }

        $('#viewDetailsBody').html(rows);
        const modal = new bootstrap.Modal(document.getElementById('viewContactModal'));
        modal.show();
      });
    }

    // ========================================================================
    // MS EXCEL EXPORT (COMPLETE DATASET)
    // ========================================================================
    function exportAllContactsToExcel() {
      if (!cachedContacts || cachedContacts.length === 0) {
        Swal.fire('No Data', 'There are no contacts available to export.', 'info');
        return;
      }

      Swal.fire({
        title: 'Generating Excel...',
        text: 'Preparing contacts export sheet',
        didOpen: () => Swal.showLoading()
      });

      // Prepare rich formatted rows for Excel
      const excelRows = cachedContacts.map((c, index) => ({
        "S.No": index + 1,
        "Full Name": c.full_name,
        "Role": (c.contact_type || '').toUpperCase(),
        "Mobile Number": c.mobile_number,
        "Alternate Mobile": c.alternate_mobile || '',
        "WhatsApp": c.whatsapp_number || c.mobile_number,
        "Email": c.email || '',
        "Address": c.address || '',
        "City": c.city || '',
        "Admission No": c.admission_number || '',
        "Class": c.student_class || '',
        "Section": c.student_section || '',
        "Father Name": c.student_father_name || '',
        "Employee ID": c.teacher_employee_id || c.staff_employee_id || c.driver_id || '',
        "Subject / Dept": c.department_subject || c.staff_department || '',
        "Designation": c.teacher_designation || c.staff_designation || c.management_designation || '',
        "Vehicle No": c.vehicle_number || '',
        "Bus Route": c.bus_route || c.driver_route || '',
        "Notes": c.notes || ''
      }));

      // Use SheetJS to build workbook
      const ws = XLSX.utils.json_to_sheet(excelRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "School_Contacts");

      const today = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `GMS_School_Contacts_${today}.xlsx`);

      Swal.close();
    }

    // ========================================================================
    // MS EXCEL IMPORT (PARSING & BATCH IMPORT)
    // ========================================================================
    function setupDragAndDrop() {
      const dropZone = document.getElementById('dropZone');
      ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropZone.classList.add('dragover');
        }, false);
      });
      ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropZone.classList.remove('dragover');
        }, false);
      });
      dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length) handleExcelFileSelect(files[0]);
      }, false);
    }

    function handleExcelFileSelect(file) {
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.SheetNames[0];
          const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '' });

          if (!rawRows || rawRows.length === 0) {
            Swal.fire('Empty File', 'No rows found in uploaded Excel sheet.', 'warning');
            return;
          }

          parsedExcelRows = rawRows;
          $('#parsedRowCount').text(rawRows.length);
          $('#readyCountBadge').text(`${rawRows.length} Valid Records`);
          $('#btnConfirmImport').prop('disabled', false);

          // Populate preview table
          let html = '';
          rawRows.slice(0, 50).forEach((r, idx) => {
            const name = r.full_name || r.Name || r['Full Name'] || '-';
            const mob = r.mobile_number || r.Mobile || r.Phone || r['Mobile Number'] || '-';
            const role = (r.contact_type || r.Role || r.Type || 'student').toLowerCase();
            const id = r.admission_number || r.Admission_No || r.employee_id || r.Emp_ID || '-';
            const cls = r.class || r.Class || r.department_subject || r.Subject || '-';
            const city = r.city || r.City || '-';

            html += `
              <tr>
                <td>${idx + 1}</td>
                <td><b>${name}</b></td>
                <td>${mob}</td>
                <td><span class="role-badge badge-${role}">${role.toUpperCase()}</span></td>
                <td>${id}</td>
                <td>${cls}</td>
                <td>${city}</td>
              </tr>
            `;
          });

          if (rawRows.length > 50) {
            html += `<tr><td colspan="7" class="text-center text-muted">...and ${rawRows.length - 50} more rows</td></tr>`;
          }

          $('#previewTableBody').html(html);
          $('#importPreviewSection').removeClass('d-none');

        } catch (err) {
          Swal.fire('Parser Error', 'Unable to parse Excel file: ' + err.message, 'error');
        }
      };
      reader.readAsArrayBuffer(file);
    }

    function executeBatchImport() {
      if (!parsedExcelRows || parsedExcelRows.length === 0) return;

      $('#btnConfirmImport').prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2"></span>Importing to Database...');

      fetch('actions.php?action=import_batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: parsedExcelRows })
      })
      .then(res => res.json())
      .then(res => {
        $('#btnConfirmImport').prop('disabled', false).html('<i class="bi bi-cloud-check-fill me-1"></i> Confirm & Import to Database');
        if (res.success) {
          bootstrap.Modal.getInstance(document.getElementById('importExcelModal')).hide();
          Swal.fire({
            icon: 'success',
            title: 'Import Complete!',
            text: res.message,
            confirmButtonColor: '#0284c7'
          });
          dataTableInstance.ajax.reload();
          loadStats();
          // Reset import modal
          parsedExcelRows = [];
          $('#importPreviewSection').addClass('d-none');
          $('#excelFileInput').val('');
        } else {
          Swal.fire('Import Error', res.error || 'Failed to import records', 'error');
        }
      })
      .catch(err => {
        $('#btnConfirmImport').prop('disabled', false).html('<i class="bi bi-cloud-check-fill me-1"></i> Confirm & Import to Database');
        Swal.fire('Network Error', err.message, 'error');
      });
    }

    /**
     * Download Pre-formatted Sample Template for MS Excel
     */
    function downloadSampleExcel() {
      const sampleData = [
        {
          "full_name": "Aman Verma",
          "contact_type": "student",
          "mobile_number": "9812345678",
          "alternate_mobile": "9812345679",
          "email": "aman.verma@school.edu",
          "address": "Gandhi Chowk",
          "city": "Rohtas",
          "admission_number": "ADM2045",
          "class": "6",
          "section": "A",
          "father_name": "Ramesh Verma",
          "bus_route": "Route 2 - North Campus"
        },
        {
          "full_name": "Suman Devi",
          "contact_type": "parent",
          "mobile_number": "9823456789",
          "alternate_mobile": "",
          "email": "suman.d@gmail.com",
          "address": "Station Road",
          "city": "Patna",
          "relationship_with_student": "Mother",
          "occupation": "Bank Officer"
        },
        {
          "full_name": "Sunil Kumar",
          "contact_type": "teacher",
          "mobile_number": "9834567890",
          "alternate_mobile": "",
          "email": "sunil.k@school.edu",
          "address": "Civil Lines",
          "city": "Rohtas",
          "employee_id": "TCH204",
          "department_subject": "English",
          "designation": "PGT English"
        },
        {
          "full_name": "Ravi Shankar",
          "contact_type": "driver",
          "mobile_number": "9845678901",
          "alternate_mobile": "",
          "email": "",
          "address": "Bypass Road",
          "city": "Rohtas",
          "driver_id": "DRV08",
          "vehicle_number": "BR-24-F-1200",
          "bus_route": "Route 5 - South Ring"
        }
      ];

      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sample_Contacts");
      XLSX.writeFile(wb, "Sample_Contacts_Import_Template.xlsx");
    }
  </script>
</body>
</html>
