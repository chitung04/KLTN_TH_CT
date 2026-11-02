import React, { useState, useEffect } from 'react';
import BookingPage from './components/BookingPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthModal from './components/auth/AuthModal';
import ProtectedRoute from './components/routing/ProtectedRoute';
import ProfileManager from './components/profile/ProfileManager';
import DashboardRouter from './components/dashboards/DashboardRouter';
import { MedicalHistory, MedicalRecordDetails } from './components/medical-records';
import QRScanner from './components/checkin/QRScanner';
import { MyQRCode } from './components/patient';
import { UserManagement } from './components/admin';
import { SmartBookingSuggestion } from './components/smart-booking';
import { SaveMedicalRecord } from './components/doctor';
import { AppointmentHistory } from './components/appointments';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const [apiMessage, setApiMessage] = useState('Đang kết nối tới Backend...');
  const [currentPage, setCurrentPage] = useState('home'); // 'home', 'booking', 'medical-records', 'qr-checkin', 'my-qr', 'doctor-medical-records', 'patient-medical-history', 'medical-record-details'
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [selectedRecordId, setSelectedRecordId] = useState(null); // For viewing medical record details
  const [pageData, setPageData] = useState(null); // Additional data for specific pages
  const { user, logout } = useAuth();

  // Kiểm tra gọi API từ Backend (port 5000) ngay khi trang load
  useEffect(() => {
    fetch('http://localhost:5000/')
      .then(res => res.json())
      .then(data => setApiMessage(data.message))
      .catch(err => setApiMessage('Không thể kết nối đến Backend Server!'));
  }, []);

  // Navigation component with role-based menu
  const Navigation = () => {
    // Define menu items based on user role - hierarchical permissions
    const getMenuItems = () => {
      const baseItems = [
        { id: 'home', label: 'Trang chủ', roles: ['all'] }
      ];

      if (user) {
        const roleBasedItems = [];

        // Dashboard - All authenticated users
        roleBasedItems.push({
          id: 'dashboard',
          label: 'Dashboard',
          roles: ['admin', 'doctor', 'patient', 'receptionist']
        });

        // Booking - Everyone except Doctor (patients book, receptionist helps book, admin manages)
        if (user.role !== 'doctor') {
          roleBasedItems.push({
            id: 'booking',
            label: 'Đặt lịch khám',
            roles: ['patient', 'receptionist', 'admin']
          });
        }

        // Medical Records - Admin, Doctor, Patient (Doctor and Admin can see all, Patient sees their own)
        roleBasedItems.push({
          id: 'medical-records',
          label: 'Hồ sơ y tế',
          roles: ['patient', 'doctor', 'receptionist', 'admin']
        });

        // My QR Code - Only Patient (to show QR for receptionist to scan)
        if (user.role === 'patient') {
          roleBasedItems.push({
            id: 'my-qr',
            label: 'Mã QR của tôi',
            roles: ['patient']
          });
        }

        // Check-in QR Scanner - Receptionist, Admin (to scan patient QR)
        if (user.role === 'receptionist' || user.role === 'admin') {
          roleBasedItems.push({
            id: 'qr-checkin',
            label: 'Quét QR Check-in',
            roles: ['receptionist', 'admin']
          });
        }

        return [...baseItems, ...roleBasedItems];
      }

      // Guest menu
      return [
        ...baseItems,
        { id: 'booking', label: 'Đặt lịch khám', roles: ['all'] },
        { id: 'medical-records', label: 'Hồ sơ y tế', roles: ['all'] }
      ];
    };

    const menuItems = getMenuItems();

    return (
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <img 
              src={`${process.env.PUBLIC_URL}/img/logo.png`}
              alt="THCT Clinic" 
              className="logo-img"
              onError={(e) => {
                console.log('Logo load error:', e);
                e.target.style.display = 'none';
                // Show fallback when image fails to load
                const fallback = e.target.nextElementSibling;
                if (fallback && fallback.classList.contains('logo-fallback')) {
                  fallback.style.display = 'flex';
                }
              }}
              onLoad={() => {
                console.log('Logo loaded successfully');
                // Hide fallback when image loads successfully
                const img = document.querySelector('.logo-img');
                const fallback = img?.nextElementSibling;
                if (fallback && fallback.classList.contains('logo-fallback')) {
                  fallback.style.display = 'none';
                }
              }}
            />
            <div className="logo-fallback" style={{ display: 'none' }}>TC</div>
            <span className="clinic-name">THCT CLINIC</span>
          </div>
          <div className="nav-menu">
            {menuItems.map(item => (
              <a
                key={item.id}
                href="#"
                onClick={() => setCurrentPage(item.id)}
                className={currentPage === item.id ? 'active' : ''}
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className="nav-contact">
            {user ? (
              <div className="user-menu">
                <span className="user-name">
                  Xin chào, {user.fullName}
                  <span className="user-role-badge">
                    {user.role === 'admin' && '👑 Admin'}
                    {user.role === 'doctor' && '👨‍⚕️ Bác sĩ'}
                    {user.role === 'patient' && '👤 Bệnh nhân'}
                    {user.role === 'receptionist' && '👔 Lễ tân'}
                  </span>
                </span>
                <div className="user-dropdown">
                  <button className="user-avatar">{user.fullName.charAt(0).toUpperCase()}</button>
                  <div className="dropdown-content">
                    <a href="#" onClick={() => setCurrentPage('profile')}>Hồ sơ cá nhân</a>
                    <a href="#" onClick={() => logout()}>Đăng xuất</a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="auth-buttons">
                <button className="btn-login" onClick={() => { setAuthModalMode('login'); setAuthModalOpen(true); }}>
                  Đăng nhập
                </button>
                <button className="btn-register" onClick={() => { setAuthModalMode('register'); setAuthModalOpen(true); }}>
                  Đăng ký
                </button>
              </div>
            )}
            <div className="hotline">
              <span>Hotline: 1900-1234</span>
            </div>
          </div>
        </div>
      </nav>
    );
  };

  // Hero Section with Image Slider
  const HeroSection = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const images = [
      `${process.env.PUBLIC_URL}/img/bia.png`,
      `${process.env.PUBLIC_URL}/img/bia2.png`
    ];

    useEffect(() => {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % images.length);
      }, 4000); // Change slide every 4 seconds

      return () => clearInterval(timer);
    }, [images.length]);

    return (
      <section className="hero">
        <div className="hero-slider">
          {images.map((image, index) => (
            <div
              key={index}
              className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
              style={{ backgroundImage: `url(${image})` }}
            >
            </div>
          ))}
        </div>
        
        <div className="hero-content">
          <div className="hero-text">
          </div>
        </div>

        {/* Side Action Buttons */}
        <div className="hero-side-actions">
          <div className="side-action-left">
            <button 
              className="side-action-btn"
              onClick={() => {
                if (user) {
                  setCurrentPage('booking');
                } else {
                  setAuthModalMode('login');
                  setAuthModalOpen(true);
                }
              }}
              title={user ? 'Đặt lịch ngay' : 'Đăng nhập để đặt lịch'}
            >
              <span className="side-action-icon">📅</span>
              <span className="side-action-text">Đặt lịch ngay</span>
            </button>
          </div>
          
          <div className="side-action-right">
            <a 
              className="side-action-btn"
              href="tel:0123456789"
              title="Gọi ngay: 0123 456 789"
            >
              <span className="side-action-icon">📞</span>
              <span className="side-action-text">Gọi ngay</span>
            </a>
          </div>
        </div>

        {/* Slider Indicators */}
        <div className="hero-indicators">
          {images.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </section>
    );
  };

  // Features Section
  const FeaturesSection = () => (
    <section className="features">
      <div className="container">
        <h2 className="section-title">TÍNH NĂNG NỔI BẬT</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <h3>Đặt lịch khám thông minh</h3>
            <p>Đặt lịch khám theo chuyên khoa và bác sĩ, tự động kiểm tra khung giờ trống</p>
            <button 
              className="feature-btn"
              onClick={() => setCurrentPage('booking')}
            >
              Trải nghiệm
            </button>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>QR Code Check-in</h3>
            <p>Check-in nhanh chóng bằng mã QR, giảm thời gian chờ đợi tại quầy lễ tân</p>
            <button 
              className="feature-btn"
              onClick={() => setCurrentPage('qr-checkin')}
            >
              Xem demo
            </button>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📋</div>
            <h3>Hồ sơ y tế điện tử</h3>
            <p>Quản lý lịch sử khám bệnh, đơn thuốc và kết quả xét nghiệm tập trung</p>
            <button 
              className="feature-btn"
              onClick={() => setCurrentPage('medical-records')}
            >
              Xem hồ sơ
            </button>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>Gợi ý lịch khám AI</h3>
            <p>Hệ thống AI gợi ý chuyên khoa và thời điểm tái khám phù hợp</p>
            <button 
              className="feature-btn"
              onClick={() => setCurrentPage('smart-booking')}
            >
              Dùng thử AI
            </button>
          </div>
        </div>
      </div>
    </section>
  );

  // Call to Action Section
  const CTASection = () => (
    <section className="cta-section">
      <div className="container">
        <div className="cta-content">
          <button 
            className="btn btn-primary btn-large"
            onClick={() => {
              if (user) {
                setCurrentPage('booking');
              } else {
                setAuthModalMode('login');
                setAuthModalOpen(true);
              }
            }}
          >
            {user ? 'Đặt lịch ngay' : 'Đăng nhập để đặt lịch'}
          </button>
        </div>
      </div>
    </section>
  );

  // Footer
  const Footer = () => (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>THCT CLINIC</h3>
            <p>Hệ thống đặt lịch khám bệnh thông minh</p>
            <p>Khóa luận tốt nghiệp 2026</p>
          </div>
          <div className="footer-section">
            <h4>Liên hệ</h4>
            <p>📞 Hotline: 1900-1234</p>
            <p>📧 Email: contact@thctclinic.vn</p>
            <p>📍 Địa chỉ: TP.HCM</p>
          </div>
          <div className="footer-section">
            <h4>Sinh viên thực hiện</h4>
            <p>Nguyễn Thu Hằng</p>
            <p>Đỗ Chí Tùng</p>
            <p>GVHD: TS. Ngô Hữu Dũng</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 THCT Clinic System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );

  // Render different pages with role-based access control
  if (currentPage === 'booking') {
    // Only Doctor cannot access booking (they don't book appointments, they treat patients)
    if (user && user.role === 'doctor') {
      return (
        <div className="app">
          <Navigation />
          <div className="page-content">
            <div className="container">
              <div className="access-denied">
                <div className="access-denied-icon">🚫</div>
                <h2>Không có quyền truy cập</h2>
                <p>Bạn không có quyền truy cập trang này.</p>
                <p>Bác sĩ không cần đặt lịch khám. Bạn có thể xem hàng đợi bệnh nhân trong Dashboard.</p>
                <button className="btn btn-primary" onClick={() => setCurrentPage('dashboard')}>
                  Về Dashboard
                </button>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      );
    }

    return (
      <div className="app">
        <Navigation />
        <div className="page-content">
          <BookingPage onNavigate={setCurrentPage} />
        </div>
        <Footer />
        {/* Auth Modal */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authModalMode}
        />
      </div>
    );
  }

  if (currentPage === 'medical-records') {
    // Check if user is authenticated
    if (!user) {
      setCurrentPage('home');
      setAuthModalMode('login');
      setAuthModalOpen(true);
      return null;
    }

    // All authenticated users can access medical records
    // But they see different things based on their role
    return (
      <div className="app">
        <Navigation />
        <div className="page-content">
          {selectedRecordId ? (
            <MedicalRecordDetails
              medicalRecordId={selectedRecordId}
              onBack={() => setSelectedRecordId(null)}
            />
          ) : (
            <MedicalHistory
              onViewDetails={(id) => setSelectedRecordId(id)}
            />
          )}
        </div>
        <Footer />
        {/* Auth Modal */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authModalMode}
        />
      </div>
    );
  }

  if (currentPage === 'my-qr') {
    // Check if user is authenticated
    if (!user) {
      setCurrentPage('home');
      setAuthModalMode('login');
      setAuthModalOpen(true);
      return null;
    }

    // My QR Code page for patients
    return (
      <div className="app">
        <Navigation />
        <div className="page-content">
          <MyQRCode />
        </div>
        <Footer />
        {/* Auth Modal */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authModalMode}
        />
      </div>
    );
  }

  if (currentPage === 'smart-booking') {
    // Smart AI booking suggestion (available to all users)
    return (
      <div className="app">
        <Navigation />
        <div className="page-content">
          <SmartBookingSuggestion 
            onBookAppointment={(data) => {
              console.log('Booking data:', data);
              setCurrentPage('booking');
            }}
            onClose={() => setCurrentPage('home')}
          />
        </div>
        <Footer />
        {/* Auth Modal */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authModalMode}
        />
      </div>
    );
  }

  if (currentPage === 'qr-checkin') {
    // Check if user is authenticated
    if (!user) {
      setCurrentPage('home');
      setAuthModalMode('login');
      setAuthModalOpen(true);
      return null;
    }

    // Only Doctor cannot access QR check-in (handled inside QRScanner component)
    return (
      <div className="app">
        <Navigation />
        <div className="page-content">
          <QRScanner />
        </div>
        <Footer />
        {/* Auth Modal */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authModalMode}
        />
      </div>
    );
  }

  if (currentPage === 'profile') {
    if (!user) {
      // Redirect to home if not logged in
      setCurrentPage('home');
      setAuthModalMode('login');
      setAuthModalOpen(true);
      return null;
    }
    
    return (
      <div className="app">
        <Navigation />
        <div className="page-content">
          <ProfileManager />
        </div>
        <Footer />
        {/* Auth Modal */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authModalMode}
        />
      </div>
    );
  }

  if (currentPage === 'dashboard') {
    return (
      <div className="app">
        <Navigation />
        <div className="page-content">
          <ProtectedRoute>
            <DashboardRouter 
              onNavigate={(page, data) => {
                setCurrentPage(page);
                setPageData(data);
              }} 
            />
          </ProtectedRoute>
        </div>
        <Footer />
        {/* Auth Modal */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authModalMode}
        />
      </div>
    );
  }

  // Doctor Medical Records view (for specific patient)
  if (currentPage === 'create-medical-record') {
    if (!user || user.role !== 'doctor') {
      setCurrentPage('dashboard');
      return null;
    }

    return (
      <div className="app">
        <Navigation />
        <div className="page-content">
          <SaveMedicalRecord 
            patient={pageData?.patient}
            onClose={() => setCurrentPage('dashboard')}
            onSaved={() => {
              alert('Lưu hồ sơ thành công!');
              setCurrentPage('dashboard');
            }}
          />
        </div>
        <Footer />
      </div>
    );
  }

  // Patient Medical History (accessible via PatientDashboard)
  if (currentPage === 'patient-medical-history') {
    if (!user || user.role !== 'patient') {
      setCurrentPage('dashboard');
      return null;
    }

    return (
      <div className="app">
        <Navigation />
        <div className="page-content">
          {selectedRecordId ? (
            <MedicalRecordDetails
              medicalRecordId={selectedRecordId}
              onBack={() => setSelectedRecordId(null)}
            />
          ) : (
            <MedicalHistory
              onViewDetails={(id) => setSelectedRecordId(id)}
              onBack={() => setCurrentPage('dashboard')}
            />
          )}
        </div>
        <Footer />
      </div>
    );
  }

  // Medical Record Details (standalone route)
  if (currentPage === 'medical-record-details') {
    if (!user) {
      setCurrentPage('home');
      setAuthModalMode('login');
      setAuthModalOpen(true);
      return null;
    }

    return (
      <div className="app">
        <Navigation />
        <div className="page-content">
          <MedicalRecordDetails
            medicalRecordId={pageData?.recordId}
            onBack={() => setCurrentPage('dashboard')}
          />
        </div>
        <Footer />
      </div>
    );
  }

  // Patient Medical Records (for receptionist to view any patient's records)
  if (currentPage === 'patient-medical-records') {
    if (!user || (user.role !== 'receptionist' && user.role !== 'admin')) {
      setCurrentPage('dashboard');
      return null;
    }

    return (
      <div className="app">
        <Navigation />
        <div className="page-content">
          <div className="container">
            <button 
              onClick={() => setCurrentPage('dashboard')}
              style={{
                marginBottom: '20px',
                padding: '10px 20px',
                background: 'white',
                border: '2px solid #0ea5e9',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              ← Quay lại Dashboard
            </button>
            <MedicalHistory
              patientId={pageData?.patientId}
              records={pageData?.records}
              onViewDetails={(id) => {
                setSelectedRecordId(id);
                setCurrentPage('medical-record-details');
                setPageData({ recordId: id });
              }}
            />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (currentPage === 'user-management') {
    // Only admin can access user management
    if (!user || user.role !== 'admin') {
      return (
        <div className="app">
          <Navigation />
          <div className="page-content">
            <div className="container">
              <div className="access-denied">
                <div className="access-denied-icon">🚫</div>
                <h2>Không có quyền truy cập</h2>
                <p>Bạn không có quyền truy cập trang này.</p>
                <p>Chỉ quản trị viên mới có thể quản lý người dùng.</p>
                <button className="btn btn-primary" onClick={() => setCurrentPage('dashboard')}>
                  Về Dashboard
                </button>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      );
    }

    return (
      <div className="app">
        <Navigation />
        <div className="page-content">
          <UserManagement onBack={() => setCurrentPage('dashboard')} />
        </div>
        <Footer />
      </div>
    );
  }

  if (currentPage === 'appointment-history') {
    // Check if user is authenticated
    if (!user) {
      setCurrentPage('home');
      setAuthModalMode('login');
      setAuthModalOpen(true);
      return null;
    }

    return (
      <div className="app">
        <Navigation />
        <div className="page-content">
          <AppointmentHistory onBack={() => setCurrentPage('dashboard')} />
        </div>
        <Footer />
      </div>
    );
  }

  if (currentPage === 'save-medical-record') {
    // Only doctors can save medical records
    if (!user || user.role !== 'doctor') {
      setCurrentPage('dashboard');
      return null;
    }

    return (
      <div className="app">
        <Navigation />
        <div className="page-content">
          <SaveMedicalRecord 
            onClose={() => setCurrentPage('dashboard')}
            onSaved={() => {
              alert('Lưu hồ sơ thành công!');
              setCurrentPage('dashboard');
            }}
          />
        </div>
        <Footer />
      </div>
    );
  }

  // Home page
  return (
    <div className="app">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <CTASection />
      <Footer />
      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  );
}

export default App;