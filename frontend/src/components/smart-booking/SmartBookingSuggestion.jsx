import React, { useState } from 'react';
import './SmartBookingSuggestion.css';

/**
 * Smart Booking Suggestion Component
 * AI-powered appointment booking with symptom analysis
 */
const SmartBookingSuggestion = ({ onBookAppointment, onClose }) => {
  const [step, setStep] = useState(1); // 1: symptoms, 2: suggestions, 3: confirm
  const [symptoms, setSymptoms] = useState('');
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);

  // Symptom to department mapping (simple AI logic)
  const symptomKeywords = {
    'tim mạch': ['đau ngực', 'tim đập nhanh', 'huyết áp', 'khó thở', 'mệt mỏi', 'choáng váng', 'ngất xỉu'],
    'tiêu hóa': ['đau bụng', 'tiêu chảy', 'táo bón', 'nôn mửa', 'ợ hơi', 'đầy hơi', 'gan', 'dạ dày'],
    'hô hấp': ['ho', 'khó thở', 'đau họng', 'sổ mũi', 'nghẹt mũi', 'viêm phổi', 'hen suyễn'],
    'thần kinh': ['đau đầu', 'chóng mặt', 'mất ngủ', 'căng thẳng', 'lo âu', 'run tay', 'tê liệt'],
    'nội tiết': ['tiểu đường', 'tăng cân', 'giảm cân', 'khát nước', 'mệt mỏi', 'vô sinh'],
    'cơ xương khớp': ['đau khớp', 'đau lưng', 'đau cổ', 'gãy xương', 'bong gân', 'thoái hóa'],
    'da liễu': ['ngứa', 'phát ban', 'mụn', 'nấm', 'viêm da', 'dị ứng da'],
    'tai mũi họng': ['đau tai', 'ù tai', 'nghe kém', 'chảy máu cam', 'viêm amidan'],
    'mắt': ['mờ mắt', 'đau mắt', 'ngứa mắt', 'đỏ mắt', 'chảy nước mắt'],
    'răng hàm mặt': ['đau răng', 'sưng lợi', 'chảy máu chân răng', 'sâu răng'],
    'nhi': ['sốt', 'tiêu chảy ở trẻ', 'ho ở trẻ', 'biếng ăn', 'chậm phát triển'],
    'sản': ['mang thai', 'khám thai', 'đau bụng dưới', 'rong kinh', 'vô sinh']
  };

  const analyzeSymptomsAI = (symptomText) => {
    const text = symptomText.toLowerCase();
    const scores = {};

    // Calculate matching score for each department
    Object.keys(symptomKeywords).forEach(dept => {
      let score = 0;
      symptomKeywords[dept].forEach(keyword => {
        if (text.includes(keyword)) {
          score += 1;
        }
      });
      if (score > 0) {
        scores[dept] = score;
      }
    });

    // Sort by score
    const sorted = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3); // Top 3

    if (sorted.length === 0) {
      return [{
        department: 'Nội tổng quát',
        confidence: 70,
        reason: 'Triệu chứng chung, nên khám nội tổng quát để được tư vấn'
      }];
    }

    return sorted.map(([dept, score]) => ({
      department: dept.charAt(0).toUpperCase() + dept.slice(1),
      confidence: Math.min(95, 60 + score * 10),
      reason: `Phát hiện ${score} triệu chứng liên quan đến chuyên khoa này`
    }));
  };

  const getRecommendedDoctors = (department) => {
    // Mock data - trong thực tế sẽ query từ database
    const doctors = {
      'Tim mạch': [
        { name: 'BS. Nguyễn Văn A', experience: '15 năm', rating: 4.8 },
        { name: 'BS. Trần Thị B', experience: '12 năm', rating: 4.7 }
      ],
      'Tiêu hóa': [
        { name: 'BS. Lê Văn C', experience: '10 năm', rating: 4.6 }
      ],
      'Nội tổng quát': [
        { name: 'BS. Phạm Thị D', experience: '8 năm', rating: 4.5 }
      ]
    };

    return doctors[department] || doctors['Nội tổng quát'];
  };

  const getOptimalTime = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return {
      date: tomorrow.toISOString().split('T')[0],
      time: '08:00',
      reason: 'Buổi sáng ít người, bác sĩ tập trung tốt hơn'
    };
  };

  const handleAnalyze = () => {
    if (!symptoms.trim()) {
      alert('Vui lòng nhập triệu chứng!');
      return;
    }

    setLoading(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const analysis = analyzeSymptomsAI(symptoms);
      const topSuggestion = analysis[0];
      
      setSuggestions({
        departments: analysis,
        doctors: getRecommendedDoctors(topSuggestion.department),
        optimalTime: getOptimalTime(),
        urgency: symptoms.toLowerCase().includes('đau nhiều') || symptoms.toLowerCase().includes('cấp cứu') 
          ? 'Cao - Nên khám ngay' 
          : 'Bình thường'
      });
      
      setLoading(false);
      setStep(2);
    }, 1500);
  };

  const handleBooking = () => {
    const topDept = suggestions.departments[0];
    if (onBookAppointment) {
      onBookAppointment({
        department: topDept.department,
        symptoms: symptoms,
        suggestedDate: suggestions.optimalTime.date,
        suggestedTime: suggestions.optimalTime.time
      });
    }
  };

  return (
    <div className="smart-booking-container">
      <div className="smart-booking-header">
        <h2>🤖 Gợi ý khám thông minh</h2>
        <p>AI sẽ phân tích triệu chứng và gợi ý chuyên khoa phù hợp</p>
        {onClose && (
          <button className="close-btn" onClick={onClose}>✕</button>
        )}
      </div>

      {/* Step 1: Input Symptoms */}
      {step === 1 && (
        <div className="symptoms-input-section">
          <h3>Bước 1: Mô tả triệu chứng của bạn</h3>
          <textarea
            className="symptoms-textarea"
            placeholder="Ví dụ: Tôi bị đau đầu, chóng mặt và buồn nôn từ 2 ngày nay..."
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            rows="6"
          />
          
          <div className="common-symptoms">
            <p><strong>Gợi ý:</strong> Nhấn vào triệu chứng phổ biến</p>
            <div className="symptom-tags">
              {['Đau đầu', 'Sốt', 'Ho', 'Đau bụng', 'Khó thở', 'Đau ngực', 'Mệt mỏi'].map(tag => (
                <button
                  key={tag}
                  className="symptom-tag"
                  onClick={() => setSymptoms(symptoms + (symptoms ? ', ' : '') + tag.toLowerCase())}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <button 
            className="btn-analyze"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? '🔄 Đang phân tích...' : '🔍 Phân tích triệu chứng'}
          </button>
        </div>
      )}

      {/* Step 2: Show Suggestions */}
      {step === 2 && suggestions && (
        <div className="suggestions-section">
          <h3>Bước 2: Kết quả phân tích AI</h3>
          
          {/* Urgency Alert */}
          {suggestions.urgency === 'Cao - Nên khám ngay' && (
            <div className="urgency-alert">
              ⚠️ <strong>Khẩn cấp:</strong> Triệu chứng của bạn cần được khám sớm!
            </div>
          )}

          {/* Department Suggestions */}
          <div className="dept-suggestions">
            <h4>Chuyên khoa gợi ý:</h4>
            {suggestions.departments.map((dept, idx) => (
              <div key={idx} className={`dept-card ${idx === 0 ? 'recommended' : ''}`}>
                <div className="dept-header">
                  <span className="dept-name">{dept.department}</span>
                  <span className="confidence-badge" style={{
                    backgroundColor: dept.confidence >= 80 ? '#10b981' : dept.confidence >= 60 ? '#f59e0b' : '#6b7280'
                  }}>
                    {dept.confidence}% phù hợp
                  </span>
                </div>
                <p className="dept-reason">{dept.reason}</p>
                {idx === 0 && <span className="recommended-badge">⭐ Khuyến nghị</span>}
              </div>
            ))}
          </div>

          {/* Doctor Suggestions */}
          <div className="doctor-suggestions">
            <h4>Bác sĩ đề xuất:</h4>
            {suggestions.doctors.map((doctor, idx) => (
              <div key={idx} className="doctor-card">
                <div className="doctor-avatar">👨‍⚕️</div>
                <div className="doctor-info">
                  <strong>{doctor.name}</strong>
                  <p>Kinh nghiệm: {doctor.experience}</p>
                  <p>⭐ {doctor.rating}/5.0</p>
                </div>
              </div>
            ))}
          </div>

          {/* Time Suggestion */}
          <div className="time-suggestion">
            <h4>⏰ Thời gian khám tối ưu:</h4>
            <div className="time-card">
              <p><strong>Ngày:</strong> {new Date(suggestions.optimalTime.date).toLocaleDateString('vi-VN')}</p>
              <p><strong>Giờ:</strong> {suggestions.optimalTime.time}</p>
              <p className="time-reason">💡 {suggestions.optimalTime.reason}</p>
            </div>
          </div>

          <div className="action-buttons">
            <button className="btn-back" onClick={() => setStep(1)}>
              ← Sửa triệu chứng
            </button>
            <button className="btn-book" onClick={handleBooking}>
              📅 Đặt lịch ngay
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartBookingSuggestion;
