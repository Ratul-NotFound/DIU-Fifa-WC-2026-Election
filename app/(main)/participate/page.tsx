'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import {
  getTeams,
  getPositions,
  createCandidate,
  getCandidateByUid
} from '@/lib/firebase/firestore';
import type { Team, Position, Candidate } from '@/lib/types';
import { getTeamFlagUrl, getTeamAccentColor } from '@/lib/utils/helpers';

function ChevronDownIcon({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
      style={{ width: '12px', height: '12px', ...style }}
    >
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}

export default function ParticipatePage() {
  const { user, profile } = useAuth();
  const router = useRouter();

  // Data lists
  const [teams, setTeams] = useState<Team[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [existingCandidate, setExistingCandidate] = useState<Candidate | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('');
  const [batch, setBatch] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedPosId, setSelectedPosId] = useState('');
  const [manifesto, setManifesto] = useState('');
  const [photoBase64, setPhotoBase64] = useState('');

  // Dropdown states
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  const [posDropdownOpen, setPosDropdownOpen] = useState(false);
  const [teamSearchQuery, setTeamSearchQuery] = useState('');

  // Status/Feedback states
  const [compressing, setCompressing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!teamDropdownOpen) return;
    const handleOutside = () => setTeamDropdownOpen(false);
    document.addEventListener('click', handleOutside);
    return () => document.removeEventListener('click', handleOutside);
  }, [teamDropdownOpen]);

  useEffect(() => {
    if (!posDropdownOpen) return;
    const handleOutside = () => setPosDropdownOpen(false);
    document.addEventListener('click', handleOutside);
    return () => document.removeEventListener('click', handleOutside);
  }, [posDropdownOpen]);

  // Load teams, positions, and check existing registration
  useEffect(() => {
    if (!user) return;
    const uid = user.uid;

    async function loadData() {
      try {
        const [t, pos, existing] = await Promise.all([
          getTeams(),
          getPositions(),
          getCandidateByUid(uid)
        ]);

        setTeams(t);
        setPositions(pos);
        setExistingCandidate(existing);

        // Prefill form if profile data exists
        if (profile) {
          setName(profile.name || '');
          setStudentId(profile.studentId || '');
          setDepartment(profile.department || '');
          setBatch(profile.batch || '');
        }
      } catch (err) {
        console.error('Error loading registration data:', err);
        setError('Failed to load initial data.');
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, [user, profile]);

  // Client-Side Image Compression using Canvas (outputs Data URL Base64)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation: max size 8MB for upload
    if (file.size > 8 * 1024 * 1024) {
      setError('File is too large. Max size is 8MB.');
      return;
    }

    setCompressing(true);
    setError('');

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 200; // 200x200 pixels is perfect for candidate avatars
          
          let width = img.width;
          let height = img.height;
          
          // Force center crop to a clean square
          const cropSize = Math.min(width, height);
          canvas.width = MAX_SIZE;
          canvas.height = MAX_SIZE;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Draw cropped image onto square canvas
            ctx.drawImage(
              img,
              (width - cropSize) / 2,
              (height - cropSize) / 2,
              cropSize,
              cropSize,
              0,
              0,
              MAX_SIZE,
              MAX_SIZE
            );
            // Compress image to JPEG at 70% quality
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
            setPhotoBase64(compressedDataUrl);
          } else {
            setError('Could not process canvas context.');
          }
        } catch (err) {
          console.error(err);
          setError('Error processing your image. Please try another one.');
        } finally {
          setCompressing(false);
        }
      };
      
      img.onerror = () => {
        setError('Selected file is not a valid image.');
        setCompressing(false);
      };

      img.src = readerEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!name.trim() || !studentId.trim() || !department.trim() || !batch.trim() || !selectedTeamId || !selectedPosId) {
      setError('Please fill in all required fields marked with *');
      return;
    }

    if (!photoBase64) {
      setError('Please upload a profile picture.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const candidateData = {
        uid: user.uid,
        name: name.trim(),
        studentId: studentId.trim(),
        department: department.trim(),
        batch: batch.trim(),
        team: selectedTeamId,
        position: selectedPosId,
        manifesto: manifesto.trim(),
        photoUrl: photoBase64, // Base64 data URL
        approved: false, // Pending admin approval
        votesReceived: 0,
        createdAt: Date.now(),
      };

      await createCandidate(candidateData);
      setSuccess(true);
      
      // Reload existing candidate info
      const updatedCandidate = await getCandidateByUid(user.uid);
      setExistingCandidate(updatedCandidate);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return <div className="loading-center" style={{ minHeight: '80vh' }}><div className="spinner" /></div>;
  }

  // If user already applied, display their status page
  if (existingCandidate) {
    const candidateTeam = teams.find(t => t.id === existingCandidate.team);
    const candidatePosition = positions.find(p => p.id === existingCandidate.position);
    const tAccent = candidateTeam ? getTeamAccentColor(candidateTeam.name) : 'var(--blue)';

    return (
      <div className="page-content" style={{ maxWidth: '640px', paddingBottom: '100px' }}>
        <div className="section-header" style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div>
            <h1>Candidate Registration Status</h1>
            <p className="section-sub">Track the status of your election campaign registration</p>
          </div>
        </div>

        {existingCandidate.approved ? (
          <div className="alert alert-success" style={{ marginBottom: 'var(--space-6)', display: 'flex', gap: 'var(--space-3)' }}>
            <div>🏆</div>
            <div>
              <strong>Your application has been approved!</strong> You are officially running as a candidate in the 2026 Committee Election. Students can now view your card and vote for you.
            </div>
          </div>
        ) : (
          <div className="alert alert-warning" style={{ marginBottom: 'var(--space-6)', display: 'flex', gap: 'var(--space-3)' }}>
            <div>⏳</div>
            <div>
              <strong>Application Pending Approval:</strong> Your registration details have been submitted. An administrator will review and approve your candidacy shortly.
            </div>
          </div>
        )}

        <div className="card" style={{ 
          background: 'rgba(12, 19, 36, 0.45)', 
          borderLeft: `4px solid ${tAccent}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-5)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <img 
              src={existingCandidate.photoUrl} 
              alt={existingCandidate.name} 
              style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', border: `2px solid ${tAccent}` }}
            />
            <div>
              <h3 style={{ margin: 0, fontSize: 'var(--text-lg)' }}>{existingCandidate.name}</h3>
              <p style={{ margin: '2px 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                {existingCandidate.department} · {existingCandidate.batch} Batch
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                Student ID: {existingCandidate.studentId}
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', borderTop: '1px solid var(--border)', paddingTop: 'var(--space-4)' }}>
            <div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>National Team</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: '4px' }}>
                {candidateTeam && (
                  <img src={getTeamFlagUrl(candidateTeam.flag)} alt="" style={{ width: '18px', height: '18px', borderRadius: '50%' }} />
                )}
                <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{candidateTeam?.name || existingCandidate.team}</span>
              </div>
            </div>
            <div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Target Position</span>
              <span style={{ display: 'block', marginTop: '4px', fontWeight: 600, fontSize: 'var(--text-sm)', color: tAccent }}>
                {candidatePosition?.title || existingCandidate.position}
              </span>
            </div>
          </div>

          {existingCandidate.manifesto && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--space-4)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>Campaign Manifesto</span>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
                &ldquo;{existingCandidate.manifesto}&rdquo;
              </p>
            </div>
          )}
        </div>

        <div style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
          <button onClick={() => router.push('/vote')} className="btn btn-ghost">
            ← Return to Voting Booth
          </button>
        </div>
      </div>
    );
  }

  // Filter teams for searchable select
  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(teamSearchQuery.toLowerCase())
  );
  
  const selectedTeam = teams.find(t => t.id === selectedTeamId);
  const selectedPosition = positions.find(p => p.id === selectedPosId);
  const accentColor = selectedTeam ? getTeamAccentColor(selectedTeam.name) : 'var(--blue)';

  return (
    <div className="page-content" style={{ maxWidth: '600px', paddingBottom: '100px' }}>
      
      <div className="section-header" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <h1>Candidate Registration Form</h1>
          <p className="section-sub">Fill out the fields to apply as a candidate in the community election.</p>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>✓ Application submitted successfully!</div>}

      <form onSubmit={handleSubmit} className="card" style={{ background: 'rgba(12, 19, 36, 0.45)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        
        {/* Step 1: Basic Info */}
        <h3 style={{ margin: 0, borderBottom: '1px solid var(--border)', paddingBottom: '8px', fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
          1. Student Details
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Full Name *</label>
            <input 
              type="text" 
              className="form-input" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
              placeholder="Prefilled Name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Student ID *</label>
            <input 
              type="text" 
              className="form-input" 
              value={studentId} 
              onChange={e => setStudentId(e.target.value)} 
              required 
              placeholder="221-15-XXXX"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Department *</label>
            <input 
              type="text" 
              className="form-input" 
              value={department} 
              onChange={e => setDepartment(e.target.value)} 
              required 
              placeholder="e.g. CSE, SWE, EEE"
            />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Batch *</label>
            <input 
              type="text" 
              className="form-input" 
              value={batch} 
              onChange={e => setBatch(e.target.value)} 
              required 
              placeholder="e.g. 58th, 60th"
            />
          </div>
        </div>

        {/* Step 2: Division and Position */}
        <h3 style={{ margin: '10px 0 0 0', borderBottom: '1px solid var(--border)', paddingBottom: '8px', fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
          2. Campaign Target
        </h3>

        {/* Searchable Team Select Dropdown */}
        <div className="form-group">
          <label className="form-label">Select Division / National Team *</label>
          <div className="custom-select-wrapper" style={{
            '--theme-accent': accentColor,
            '--theme-accent-glow': `${accentColor}33`
          } as React.CSSProperties}>
            <button
              type="button"
              className={`custom-select-trigger${teamDropdownOpen ? ' active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setTeamDropdownOpen(!teamDropdownOpen);
                setTeamSearchQuery('');
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                {selectedTeam ? (
                  <>
                    <img 
                      src={getTeamFlagUrl(selectedTeam.flag)} 
                      alt="" 
                      className="flag-circular" 
                      style={{ width: '22px', height: '22px', border: `1.5px solid ${accentColor}` }} 
                    />
                    <span style={{ fontWeight: 600 }}>{selectedTeam.name}</span>
                  </>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>Choose your team division…</span>
                )}
              </div>
              <span className="custom-select-arrow">
                <ChevronDownIcon />
              </span>
            </button>

            <div className={`custom-select-menu${teamDropdownOpen ? ' open' : ''}`} onClick={e => e.stopPropagation()}>
              <div className="custom-select-search-wrapper">
                <span className="custom-select-search-icon">🔍</span>
                <input
                  type="text"
                  className="custom-select-search-input"
                  placeholder="Search division..."
                  value={teamSearchQuery}
                  onChange={e => setTeamSearchQuery(e.target.value)}
                  autoFocus={teamDropdownOpen}
                />
              </div>
              <div className="custom-select-options">
                {filteredTeams.length === 0 ? (
                  <div className="custom-select-empty">No divisions found</div>
                ) : (
                  filteredTeams.map(t => {
                    const isSelected = t.id === selectedTeamId;
                    const tAccent = getTeamAccentColor(t.name);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        className={`custom-select-option${isSelected ? ' selected' : ''}`}
                        onClick={() => {
                          setSelectedTeamId(t.id);
                          setTeamDropdownOpen(false);
                          setTeamSearchQuery('');
                        }}
                        style={{ '--theme-accent': tAccent } as React.CSSProperties}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <img src={getTeamFlagUrl(t.flag)} alt="" className="flag-circular" style={{ width: '18px', height: '18px', border: `1px solid ${tAccent}` }} />
                          <span>{t.name}</span>
                        </div>
                        {isSelected && <span style={{ color: tAccent }}>✓</span>}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Position Selection Custom Dropdown */}
        <div className="form-group">
          <label className="form-label">Select Position *</label>
          <div className="custom-select-wrapper" style={{
            '--theme-accent': accentColor,
            '--theme-accent-glow': `${accentColor}33`
          } as React.CSSProperties}>
            <button
              type="button"
              className={`custom-select-trigger${posDropdownOpen ? ' active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setPosDropdownOpen(!posDropdownOpen);
              }}
            >
              <span>{selectedPosition?.title || 'Choose targeted position…'}</span>
              <span className="custom-select-arrow">
                <ChevronDownIcon />
              </span>
            </button>

            <div className={`custom-select-menu${posDropdownOpen ? ' open' : ''}`}>
              <div className="custom-select-options">
                {positions.map(p => {
                  const isSelected = p.id === selectedPosId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`custom-select-option${isSelected ? ' selected' : ''}`}
                      onClick={() => {
                        setSelectedPosId(p.id);
                        setPosDropdownOpen(false);
                      }}
                      style={{ '--theme-accent': accentColor } as React.CSSProperties}
                    >
                      <span>{p.title}</span>
                      {isSelected && <span>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Photo and Manifesto */}
        <h3 style={{ margin: '10px 0 0 0', borderBottom: '1px solid var(--border)', paddingBottom: '8px', fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
          3. Media & Manifesto
        </h3>

        {/* Image upload with crop uploader */}
        <div className="form-group">
          <label className="form-label">Profile Picture *</label>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            style={{ display: 'none' }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            {photoBase64 ? (
              <img 
                src={photoBase64} 
                alt="Crop preview" 
                style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', border: `2px solid ${accentColor}` }}
              />
            ) : (
              <div style={{ width: '80px', height: '80px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: 'var(--text-muted)' }}>
                👤
              </div>
            )}

            <div>
              <button 
                type="button" 
                onClick={triggerFileSelect} 
                className="btn btn-ghost btn-sm"
                disabled={compressing || submitting}
              >
                {photoBase64 ? 'Change Photo' : 'Upload Photo'}
              </button>
              <p style={{ margin: '6px 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                {compressing ? 'Compressing picture…' : 'Square crops and compressions are performed automatically (Free tier).'}
              </p>
            </div>
          </div>
        </div>

        {/* Campaign Manifesto text */}
        <div className="form-group">
          <label className="form-label">Campaign Manifesto / Description</label>
          <textarea
            className="form-textarea"
            value={manifesto}
            onChange={e => setManifesto(e.target.value)}
            placeholder="Share your goals and plans for this national team division. Keep it clean and professional."
            rows={4}
          />
        </div>

        {/* Submit */}
        <div style={{ marginTop: 'var(--space-3)', borderTop: '1px solid var(--border)', paddingTop: 'var(--space-4)' }}>
          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={submitting || compressing}
            style={{ background: accentColor, borderColor: accentColor }}
          >
            {submitting ? 'Submitting Application…' : 'Submit Candidate Registration'}
          </button>
        </div>

      </form>
    </div>
  );
}
