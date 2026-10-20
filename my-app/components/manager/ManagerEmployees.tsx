'use client';

import React, { useState } from 'react';
import { useEMS } from '../../context/EMSContext';
import {
  Search,
  Filter,
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  FileText,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  Star,
  Tag,
} from 'lucide-react';
import { Employee } from '../../types/ems';

export function ManagerEmployees() {
  const { employees, attendanceRecords, leaveRequests, tasks, sendDefaultPassword } = useEMS();
  const [isSendingPass, setIsSendingPass] = useState(false);

  const [topTab, setTopTab] = useState<'list' | 'attendance'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  // Active employee for dossier view (Figma Page 15)
  const [activeEmployee, setActiveEmployee] = useState<Employee | null>(null);
  const [dossierTab, setDossierTab] = useState<'overview' | 'performance' | 'leave' | 'attendance' | 'notes'>('overview');

  // Dynamic roster data connected to live Supabase / local employees state
  const rosterData = employees.map((emp) => ({
    id: emp.id,
    name: `${emp.firstName} ${emp.lastName}`.trim(),
    email: emp.email,
    position: emp.position || 'Staff',
    dept: emp.department
      ? emp.department.includes('Department')
        ? emp.department
        : `${emp.department} Department`
      : 'General Department',
    status: emp.status || 'Active',
    raw: emp,
  }));

  const filteredRoster = rosterData.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept =
      selectedDept === 'ALL' ||
      emp.dept.toLowerCase().includes(selectedDept.toLowerCase());
    return matchesSearch && matchesDept;
  });

  // If viewing detailed Employee Profile dossier (Figma Page 15)
  if (activeEmployee) {
    return (
      <div className="space-y-4 animate-in fade-in duration-200">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setActiveEmployee(null)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-[#F2F7F5] text-[#3D6B5F] rounded-xl text-xs font-bold border border-[#CDE0DA] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Employee</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                setIsSendingPass(true);
                try {
                  await sendDefaultPassword(activeEmployee.id);
                } finally {
                  setIsSendingPass(false);
                }
              }}
              disabled={isSendingPass}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2A8257] hover:bg-[#206744] text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              title="Generate and dispatch fresh default password via EmailJS"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{isSendingPass ? 'Sending via EmailJS...' : 'Email Default Password'}</span>
            </button>
            <span className="text-xs font-mono text-white/90 hidden sm:inline">
              Dossier: {activeEmployee.firstName} {activeEmployee.lastName}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column (6 Cols): Personal Info & About & Skills (Figma Page 15) */}
          <div className="lg:col-span-6 space-y-4">
            {/* Employee Header Card */}
            <div className="bg-white rounded-2xl p-5 shadow-md border border-[#CDE0DA] space-y-4">
              <div className="flex items-center gap-4 pb-3 border-b border-[#E7EFEA]">
                <img
                  src={activeEmployee.avatar}
                  alt={activeEmployee.firstName}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-[#4A7268]"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#1C3630]">
                      {activeEmployee.firstName} {activeEmployee.lastName}
                    </h3>
                    <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-[#E6F4EA] text-[#2A8257]">
                      {activeEmployee.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#557B71]">
                    {activeEmployee.position} • {activeEmployee.department} Department
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-[#2E4D46]">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#557B71]" />
                  <span>{activeEmployee.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#557B71]" />
                  <span>{activeEmployee.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-[#557B71]" />
                  <span>Joined: {activeEmployee.dateJoined}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#557B71]" />
                  <span>Address: {activeEmployee.address}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#557B71]">
                  <span>Emergency: {activeEmployee.emergencyContact.name} ({activeEmployee.emergencyContact.phone})</span>
                </div>
              </div>
            </div>

            {/* Tabs: Overview / Performance / Leave / Attendance / Notes (Figma Page 15) */}
            <div className="bg-white rounded-2xl p-5 shadow-md border border-[#CDE0DA] space-y-3">
              <div className="flex border-b border-[#E7EFEA] gap-3 text-xs overflow-x-auto">
                {['Overview', 'Performance', 'Leave', 'Attendance', 'Notes'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDossierTab(tab.toLowerCase() as any)}
                    className={`pb-2 font-bold transition-all border-b-2 whitespace-nowrap ${
                      dossierTab === tab.toLowerCase()
                        ? 'border-[#2A8257] text-[#2A8257]'
                        : 'border-transparent text-[#6B8E85] hover:text-[#1C3630]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* About Section */}
              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-[#1C3630]">About</h4>
                <p className="text-[#41635B] leading-relaxed bg-[#F9FBFB] p-3 rounded-xl border border-[#DCE8E4]">
                  {activeEmployee.bio || 'Dedicated team member supporting core department projects.'}
                </p>
              </div>

              {/* Skills Section */}
              <div className="space-y-1.5 text-xs pt-1">
                <h4 className="font-bold text-[#1C3630]">Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {['React & Next.js', 'Figma & UI Systems', 'Database Optimization', 'Agile Delivery'].map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 bg-[#EEF5F2] text-[#3D6B5F] rounded-lg text-[10px] font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (6 Cols): Employment Details & Documents (Figma Page 15) */}
          <div className="lg:col-span-6 space-y-4">
            {/* Employment Details Card */}
            <div className="bg-white rounded-2xl p-5 shadow-md border border-[#CDE0DA] space-y-3 text-xs text-[#2E4D46]">
              <h3 className="text-xs font-bold text-[#1C3630] pb-2 border-b border-[#E7EFEA]">
                Employment Details
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-[#F0F5F3]">
                  <span className="text-[#6D8F86]">Position:</span>
                  <span className="font-semibold text-[#1C3630]">{activeEmployee.position}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F0F5F3]">
                  <span className="text-[#6D8F86]">Department:</span>
                  <span className="font-semibold text-[#1C3630]">{activeEmployee.department} Department</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F0F5F3]">
                  <span className="text-[#6D8F86]">Employment Type:</span>
                  <span className="font-semibold text-[#1C3630]">{activeEmployee.employmentDetails.employmentType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F0F5F3]">
                  <span className="text-[#6D8F86]">Work Schedule:</span>
                  <span className="font-mono text-[#2A8257] font-bold">Monday - Friday (8:00 AM - 5:00 PM)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F0F5F3]">
                  <span className="text-[#6D8F86]">Office Location:</span>
                  <span className="font-semibold text-[#1C3630]">{activeEmployee.employmentDetails.officeLocation}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#6D8F86]">Salary:</span>
                  <span className="font-bold text-[#1C3630] font-mono">{activeEmployee.employmentDetails.salary}</span>
                </div>
              </div>
            </div>

            {/* Documents Table (Figma Page 15) */}
            <div className="bg-white rounded-2xl p-5 shadow-md border border-[#CDE0DA] space-y-3">
              <h3 className="text-xs font-bold text-[#1C3630] pb-2 border-b border-[#E7EFEA]">
                Documents
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[#6C8E85] font-semibold text-[10px] border-b border-[#E7EFEA]">
                    <tr>
                      <th className="py-2 px-2">Document Name</th>
                      <th className="py-2 px-2">Type</th>
                      <th className="py-2 px-2">Uploaded On</th>
                      <th className="py-2 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F5F3] text-[#2C4841]">
                    {activeEmployee.documents.map((doc) => (
                      <tr key={doc.id}>
                        <td className="py-2 px-2 font-medium text-[#1C3630]">{doc.name}</td>
                        <td className="py-2 px-2 text-[#6D8F86]">{doc.type}</td>
                        <td className="py-2 px-2 font-mono text-[10px] text-[#6D8F86]">{doc.uploadedOn}</td>
                        <td className="py-2 px-2 text-right">
                          <button
                            onClick={() => alert(`Downloading ${doc.name}`)}
                            className="p-1 hover:bg-[#EEF5F2] text-[#2A8257] rounded"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Employee List (Figma Page 14)
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#CDE0DA] space-y-5 animate-in fade-in duration-200">
      {/* Top Tabs: Employee List | Attendance Record */}
      <div className="flex border-b border-[#E7EFEA] gap-4 pb-1">
        <button
          onClick={() => setTopTab('list')}
          className={`pb-2.5 text-xs font-bold transition-all border-b-2 ${
            topTab === 'list'
              ? 'border-[#2A8257] text-[#2A8257]'
              : 'border-transparent text-[#6B8E85] hover:text-[#1C3630]'
          }`}
        >
          Employee List
        </button>
        <button
          onClick={() => setTopTab('attendance')}
          className={`pb-2.5 text-xs font-bold transition-all border-b-2 ${
            topTab === 'attendance'
              ? 'border-[#2A8257] text-[#2A8257]'
              : 'border-transparent text-[#6B8E85] hover:text-[#1C3630]'
          }`}
        >
          Attendance Record
        </button>
      </div>

      {/* Filter and Search Bar (Figma Page 14) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7C9F97]" />
          <input
            type="text"
            placeholder="Search by name, position..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#F2F7F5] border border-[#D3E5DE] rounded-xl text-xs text-[#1E3731] placeholder:text-[#8AA8A1] focus:outline-none"
          />
        </div>

        <div>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 bg-[#F2F7F5] border border-[#D3E5DE] rounded-xl text-xs text-[#1E3731] focus:outline-none"
          >
            <option value="ALL">All Departments</option>
            <option value="IT">IT Department</option>
            <option value="HR">HR Department</option>
            <option value="Finance">Finance Department</option>
            <option value="Marketing">Marketing Department</option>
          </select>
        </div>
      </div>

      {/* Table (Figma Page 14: Employee, Position, Department, Status, Action) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-[#6C8E85] font-semibold text-[11px] border-b border-[#E7EFEA] pb-2">
            <tr>
              <th className="py-2.5 px-3">Employee</th>
              <th className="py-2.5 px-3">Position</th>
              <th className="py-2.5 px-3">Department</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F5F3] text-[#2C4841]">
            {filteredRoster.map((emp) => (
              <tr key={emp.id} className="hover:bg-[#F7FAF9]">
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#EBF3F0] text-[#3D6B5F] flex items-center justify-center font-bold text-xs">
                      {emp.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-[#1C3630]">{emp.name}</p>
                      <p className="text-[10px] text-[#7A9E96]">{emp.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 font-semibold text-[#1C3630]">{emp.position}</td>
                <td className="py-3 px-3 text-[#52776E]">{emp.dept}</td>
                <td className="py-3 px-3">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                      emp.status === 'Active' ? 'text-[#2A8257]' : 'text-[#DF8E15]'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        emp.status === 'Active' ? 'bg-[#2A8257]' : 'bg-[#DF8E15]'
                      }`}
                    />
                    <span>{emp.status}</span>
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <button
                    onClick={() => {
                      setActiveEmployee(emp.raw);
                    }}
                    className="px-3 py-1 bg-[#EEF5F2] hover:bg-[#D5E4DE] text-[#3D6B5F] rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination row (Figma Page 14) */}
      <div className="flex items-center justify-between text-xs text-[#6C8E85] pt-3 border-t border-[#E7EFEA]">
        <span>
          Showing {filteredRoster.length === 0 ? 0 : 1} to {filteredRoster.length} of {employees.length} employees
        </span>
        <div className="flex items-center gap-1">
          <button className="w-6 h-6 rounded bg-[#3D6B5F] text-white font-bold text-xs flex items-center justify-center">
            1
          </button>
        </div>
      </div>
    </div>
  );
}
