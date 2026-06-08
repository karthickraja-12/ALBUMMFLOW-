import { CheckCircle2 } from 'lucide-react';
import { useParams } from 'react-router-dom';

export default function ConfirmationPage() {
  const { token } = useParams();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="text-center max-w-sm animate-slide-up">
        <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Selection Submitted!</h1>
        <p className="text-slate-500 text-sm mb-6 text-balance">
          Your photo selections have been successfully submitted. Your photographer will receive your selection shortly.
        </p>
        <div className="card p-4 text-left bg-slate-50">
          <p className="text-xs font-semibold text-slate-700 mb-1">What happens next?</p>
          <ol className="text-xs text-slate-500 space-y-1 list-decimal list-inside">
            <li>Your photographer is notified</li>
            <li>Selected photos are prepared</li>
            <li>Final album is delivered to you</li>
          </ol>
        </div>
        <p className="text-xs text-slate-400 mt-6">
          You can safely close this page.
        </p>
      </div>
    </div>
  );
}
