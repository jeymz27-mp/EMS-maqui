'use client';

import React, { useState, useEffect } from 'react';
import { useEMS } from '../../context/EMSContext';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  ExternalLink,
  Copy,
  Check,
  Server,
  Zap,
} from 'lucide-react';
import {
  testSupabaseConnection,
  forceReseedSupabase,
} from '../../lib/supabaseService';
import {
  getSupabaseConfig,
  setSupabaseConfig,
  clearSupabaseConfig,
  isSupabaseConfigured,
} from '../../lib/supabase';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupabaseModal({ isOpen, onClose }: SupabaseModalProps) {
  const { isSupabaseActive, dbSyncStatus, refreshFromDatabase, addToast } = useEMS();

  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'success' | 'error' | 'warning';
    message: string;
    latencyMs?: number;
  }>({ status: 'idle', message: '' });

  const [copiedSQL, setCopiedSQL] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const config = getSupabaseConfig();
      setUrl(config.url || '');
      setAnonKey(config.anonKey || '');
      setTestResult({ status: 'idle', message: '' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setTestResult({
        status: 'error',
        message: 'Please provide both Supabase Project URL and Anon Public Key.',
      });
      return;
    }

    // Temporarily save to test
    setSupabaseConfig(url, anonKey);
    setTesting(true);

    try {
      const res = await testSupabaseConnection();
      if (res.connected) {
        if (res.error) {
          setTestResult({
            status: 'warning',
            message: res.error,
            latencyMs: res.latencyMs,
          });
        } else {
          setTestResult({
            status: 'success',
            message: `Connection established successfully! Supabase tables detected (${res.latencyMs}ms latency).`,
            latencyMs: res.latencyMs,
          });
        }
      } else {
        setTestResult({
          status: 'error',
          message: res.error || 'Connection failed. Verify your URL and Anon Key.',
        });
      }
    } catch (err: any) {
      setTestResult({
        status: 'error',
        message: err?.message || 'Connection error.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveAndSync = async () => {
    if (!url.trim() || !anonKey.trim()) {
      addToast('error', 'Incomplete Config', 'Please provide both URL and Anon Key.');
      return;
    }

    setSupabaseConfig(url, anonKey);
    addToast('info', 'Connecting', 'Synchronizing data with Supabase...');
    await refreshFromDatabase();
    addToast('success', 'Supabase Connected', 'EMS is now connected and synchronizing live with PostgreSQL.');
    onClose();
  };

  const handleClear = () => {
    clearSupabaseConfig();
    setUrl('');
    setAnonKey('');
    setTestResult({
      status: 'idle',
      message: 'Supabase configuration removed. Application returned to local storage mode.',
    });
    addToast('info', 'Disconnected', 'Returned to local storage database mode.');
  };

  const handleSeedDatabase = async () => {
    setSeeding(true);
    try {
      const res = await forceReseedSupabase();
      if (res.success) {
        addToast('success', 'Database Seeded', res.message);
        await refreshFromDatabase();
      } else {
        addToast('error', 'Seeding Error', res.message);
      }
    } finally {
      setSeeding(false);
    }
  };

  const handleCopySchemaPath = () => {
    navigator.clipboard.writeText('supabase/schema.sql');
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 2000);
    addToast('info', 'Copied Path', 'Schema SQL path copied: supabase/schema.sql');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] text-[#1E3731] w-full max-w-2xl rounded-3xl shadow-2xl border border-[#CDE0DA] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-[#3D635B] text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-emerald-300">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Supabase Database Integration</h2>
              <p className="text-xs text-white/70">Connect EMS to PostgreSQL cloud storage & real-time sync</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white/80 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Current Status Pill */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F0F6F4] border border-[#D5E5E0]">
            <div className="flex items-center gap-3">
              <div
                className={`w-3.5 h-3.5 rounded-full ${
                  isSupabaseActive
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-amber-400'
                }`}
              />
              <div>
                <span className="font-bold text-sm text-[#1E3731]">
                  Status:{' '}
                  {isSupabaseActive
                    ? 'Supabase PostgreSQL Connected (Live)'
                    : 'Local Mode (Browser Storage Active)'}
                </span>
                <p className="text-[11px] text-[#557B72]">
                  {isSupabaseActive
                    ? `Live sync active. Mutations replicate to Supabase PostgreSQL.`
                    : `Provide your Supabase URL & Anon Key below to activate cloud persistence.`}
                </p>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                isSupabaseActive
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              {dbSyncStatus}
            </span>
          </div>

          {/* Form Credentials */}
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-[#2A4B43] mb-1.5 uppercase tracking-wider">
                Supabase Project URL
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-4 py-2.5 rounded-xl border border-[#CDE0DA] bg-[#FAFCFB] text-[#1E3731] placeholder:text-slate-400 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#3D635B]"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Found in: Supabase Dashboard &rarr; Project Settings &rarr; API &rarr; Project URL
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#2A4B43] mb-1.5 uppercase tracking-wider">
                Supabase Anon (Public) API Key
              </label>
              <textarea
                rows={3}
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-4 py-2.5 rounded-xl border border-[#CDE0DA] bg-[#FAFCFB] text-[#1E3731] placeholder:text-slate-400 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#3D635B]"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Found in: Supabase Dashboard &rarr; Project Settings &rarr; API &rarr; Project API Keys &rarr; anon public
              </span>
            </div>
          </div>

          {/* Test Connection Banner */}
          {testResult.message && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
                testResult.status === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : testResult.status === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {testResult.status === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              )}
              <div className="space-y-1">
                <p className="font-semibold">{testResult.message}</p>
                {testResult.latencyMs && (
                  <p className="text-[10px] opacity-80">Response time: {testResult.latencyMs}ms</p>
                )}
              </div>
            </div>
          )}

          {/* Database Setup & SQL Migration Guide */}
          <div className="p-4 rounded-2xl bg-[#F8FAF9] border border-[#DEE9E5] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#2A4B43] flex items-center gap-1.5">
                <Server className="w-4 h-4 text-[#3D635B]" />
                PostgreSQL Schema & Seed Script
              </span>
              <button
                onClick={handleCopySchemaPath}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#CDE0DA] text-[#2A4B43] hover:bg-slate-50 text-[11px] font-medium transition-colors"
              >
                {copiedSQL ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Schema Path</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Before syncing, execute <code className="bg-slate-200/80 px-1 py-0.5 rounded font-mono text-[10px]">supabase/schema.sql</code> in your Supabase SQL Editor to create the 6 EMS tables (employees, tasks, attendance_records, leave_requests, announcements, activities) with Row Level Security and Realtime enabled.
            </p>
            {isSupabaseActive && (
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={handleSeedDatabase}
                  disabled={seeding}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-1.5 text-[11px] transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
                  {seeding ? 'Populating Database...' : 'Seed / Restore Enterprise Demo Data'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-[#F2F6F5] border-t border-[#CDE0DA] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              className="px-3 py-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors font-medium text-xs"
            >
              Reset to Local
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTest}
              disabled={testing}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-[#2A4B43] border border-[#CDE0DA] rounded-xl font-semibold transition-colors flex items-center gap-1.5 text-xs"
            >
              <Zap className={`w-3.5 h-3.5 ${testing ? 'animate-spin text-amber-500' : 'text-emerald-600'}`} />
              {testing ? 'Pinging...' : 'Test Connection'}
            </button>
            <button
              onClick={handleSaveAndSync}
              className="px-5 py-2 bg-[#3D635B] hover:bg-[#32524B] text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-1.5 text-xs hover:shadow-lg"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              Save & Synchronize
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
