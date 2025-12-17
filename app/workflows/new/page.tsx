'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import WorkflowManagement from '@/components/admin/WorkflowManagement';

export default function NewWorkflowPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/workflows" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
          ← Back to Workflows
        </Link>
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Create New Workflow</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Use the workflow editor below to create a new workflow with drag-drop graph editor.
        </p>
        <WorkflowManagement />
      </div>
    </div>
  );
}
