import { useState } from 'react';

function App() {
  const [excelFile, setExcelFile] = useState(null);
  const [wing, setWing] = useState('');
  const [certType, setCertType] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!excelFile || !wing || !certType) {
      alert('Please fill all fields.');
      return;
    }

    const formData = new FormData();
    formData.append('excel', excelFile);
    formData.append('wing', wing);
    formData.append('certType', certType);

    try {
      const response = await fetch('http://localhost:3000/generate-cert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate certificates');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'certificates.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error(error);
      alert('Something went wrong. Check the server or inputs.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md space-y-6"
      >
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-4">
          NCC Certificate Generator
        </h1>

        <div>
          <label className="block mb-1 font-medium">Upload Excel File</label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setExcelFile(e.target.files[0])}
            className="block w-full border p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Select Wing</label>
          <select
            value={wing}
            onChange={(e) => setWing(e.target.value)}
            className="block w-full border p-2 rounded"
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
          <label className="block mb-1 font-medium">Select Certificate Type</label>
          <select
            value={certType}
            onChange={(e) => setCertType(e.target.value)}
            className="block w-full border p-2 rounded"
            required
          >
            <option value="">Select Certificate Type</option>
            <option value="Merit">Merit</option>
            <option value="Participation">Participation</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700 transition"
        >
          Generate Certificates
        </button>
      </form>
    </div>
  );
}

export default App;
