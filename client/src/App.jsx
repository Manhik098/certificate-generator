import { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';

function App() {
  const [excelFile, setExcelFile] = useState(null);
  const [wing, setWing] = useState('');
  const [certType, setCertType] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewURL, setPreviewURL] = useState('');

  const getWingKey = (wing) => {
    const wingLower = wing.toLowerCase();
    if (wingLower.includes('naval')) return 'naval';
    if (wingLower.includes('girls')) return 'girlsbn';
    if (wingLower.includes('air')) return 'air';
    if (wingLower.includes('2 chd')) return '2chdbn';
    return '';
  };

  useEffect(() => {
    if (wing && certType) {
      const wingKey = getWingKey(wing);
      const certKey = certType.toLowerCase();
      if (wingKey) {
        setPreviewLoading(true);
        setPreviewURL(`https://certificate-generator-backend-x2xh.onrender.com/generate-cert/templates/${wingKey}-${certKey}.png`);
      } else {
        setPreviewURL('');
      }
    } else {
      setPreviewURL('');
    }
  }, [wing, certType]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!excelFile || !wing || !certType) {
      toast.error('Please fill all fields.');
      return;
    }

    const formData = new FormData();
    formData.append('excel', excelFile);
    formData.append('wing', wing);
    formData.append('certType', certType);

    try {
      setLoading(true);
      const response = await fetch('https://certificate-generator-backend-x2xh.onrender.com/generate-cert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to generate certificates');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'certificates.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Certificates downloaded!');
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Something went wrong!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-10 bg-black">
      {/* Background Image */}
      <img
        src="/public/bg.jpg" // ← Place this image inside your /public folder
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover opacity-60"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-40" />

      {/* Main Form */}
      <form
        onSubmit={handleSubmit}
        className="relative z-10 bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg space-y-6 border border-blue-200"
      >
        <Toaster position="top-center" />
        <h1 className="text-3xl font-bold text-center text-blue-700">
          NCC Certificate Generator
        </h1>

        <div>
          <label className="block mb-1 font-medium text-gray-700">
            Upload Excel File
          </label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setExcelFile(e.target.files[0])}
            className="block w-full border border-gray-300 p-2 rounded shadow-sm"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium text-gray-700">
            Select Wing
          </label>
          <select
            value={wing}
            onChange={(e) => setWing(e.target.value)}
            className="block w-full border border-gray-300 p-2 rounded shadow-sm"
            required
          >
            <option value="">Select Wing</option>
            <option value="1CHD NAVAL UNIT">1CHD NAVAL UNIT</option>
            <option value="1 CHD GIRLS BN">1 CHD GIRLS BN</option>
            <option value="2 CHD BN">2 CHD BN</option>
            <option value="1 CHD AIR SQN">1 CHD AIR SQN</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium text-gray-700">
            Select Certificate Type
          </label>
          <select
            value={certType}
            onChange={(e) => setCertType(e.target.value)}
            className="block w-full border border-gray-300 p-2 rounded shadow-sm"
            required
          >
            <option value="">Select Certificate Type</option>
            <option value="Merit">Merit</option>
            <option value="Participation">Participation</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full text-white font-semibold py-2 px-4 rounded transition duration-200 ${
            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Generating...' : 'Generate Certificates'}
        </button>

        <div className="mt-6">
          <h2 className="text-md font-semibold mb-2 text-gray-700">
            Certificate Preview:
          </h2>
          {wing && certType ? (
            <div className="flex items-center justify-center">
              {previewLoading && <div className="text-gray-500">Loading preview...</div>}
              {previewURL && (
                <img
                  src={previewURL}
                  alt="Certificate Preview"
                  onLoad={() => setPreviewLoading(false)}
                  onError={() => {
                    setPreviewLoading(false);
                    setPreviewURL('');
                    toast.error('Preview image not found');
                  }}
                  className={`w-full h-auto rounded-xl shadow-lg border border-gray-300 object-contain max-h-[500px] ${
                    previewLoading ? 'hidden' : ''
                  }`}
                />
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center">
              Please select wing and certificate type to preview
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

export default App;
