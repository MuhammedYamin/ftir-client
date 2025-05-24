import React, { useState } from "react";
import "./App.css"; 

const App = () => {
  const [file, setFile] = useState(null);
  const [detectedMaxima, setDetectedMaxima] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detectedMinima, setDetectedMinima] = useState([]);
  const [imageUrl, setImageUrl] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [imageFilename, setImageFilename] = useState("");


  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setDetectedMaxima([]);
    setError(null);
    setDetectedMinima([]);
    setImageUrl(null);
    setShowResults(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      setDetectedMaxima([]);
      setError("No file selected.");
      return;
    }

    if (file.type !== "text/csv") {
      setDetectedMaxima([]);
      setError("Please upload a valid CSV file.");
      return;
    }

    setLoading(true);
    setDetectedMaxima([]);
    setError(null);
    setDetectedMinima([]);
    setImageUrl(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/upload_ftir/", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setLoading(false);

      if (data.detected_maxima) {
        setDetectedMaxima(data.detected_maxima);
      }
      if (data.detected_minima) {
        setDetectedMinima(data.detected_minima);
      } else {
        setError(data.error || "An unknown error occurred.");
      }

      setImageFilename(data.image_filename);

      
      const imageResponse = await fetch(
        `http://127.0.0.1:8000/get_spectrum_image/${data.image_filename}`
      );
      if (imageResponse.ok) {
        const imageUrl = await imageResponse.blob();
        setImageUrl(URL.createObjectURL(imageUrl));
      } else {
        setError("Failed to fetch the spectrum image.");
      }

      setShowResults(true);
    } catch (error) {
      setLoading(false);
      setError(`Error: ${error.message}`);
    }
  };

  const handleDownloadPDF = () => {
  if (!imageFilename || !detectedMaxima.length || !detectedMinima.length) {
    alert("No data to generate PDF.");
    return;
  }

  const maximaJSON = JSON.stringify(detectedMaxima);
  const minimaJSON = JSON.stringify(detectedMinima);

  const url = new URL("http://127.0.0.1:8000/download_pdf/");
  url.searchParams.append("image_filename", imageFilename);
  url.searchParams.append("maxima", maximaJSON);
  url.searchParams.append("minima", minimaJSON);

  window.open(url.toString(), "_blank");
};


 return (
  <div className="container">
    <h1>FTIR Characteristic Analysis</h1>

    {!showResults && (
      <form onSubmit={handleSubmit} className="form">
        <label htmlFor="file">Choose CSV File:</label>
        <input
          type="file"
          id="file"
          accept=".csv"
          onChange={handleFileChange}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Processing..." : "Upload File"}
        </button>
      </form>
    )}

    {loading && <p>Loading...</p>}
    {error && <p className="error">{error}</p>}

    {showResults && (
      <div className="results-container">
        <div className="results-section">
          <div className="image-container">
            {imageUrl && (
              <>
                <h3 className="fixed-heading">Spectrum with Functional Groups</h3>
                <img
                  src={imageUrl}
                  alt="FTIR Spectrum"
                  className="spectrum-image"
                />
              </>
            )}
          </div>
        </div>

        <div className="tables-container">
          <div className="table-section">
            <h3 className="fixed-heading">Detected Peaks</h3>
            <table className="results-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Wavenumber</th>
                  <th>Absorbance</th>
                  <th>Group</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {detectedMaxima.length > 0 ? (
                  detectedMaxima.map((peak, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{peak.wavenumber}</td>
                      <td>{peak.absorbance}</td>
                      <td>{peak.functional_group}</td>
                      <td>{peak.type}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">No peaks detected.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="table-section">
            <h3 className="fixed-heading">Detected Minima</h3>
            <table className="results-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Wavenumber</th>
                  <th>Absorbance</th>
                  <th>Group</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {detectedMinima.length > 0 ? (
                  detectedMinima.map((minima, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{minima.wavenumber || "N/A"}</td>
                      <td>{minima.absorbance || "N/A"}</td>
                      <td>{minima.functional_group || "N/A"}</td>
                      <td>{minima.type || "N/A"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">No minima detected.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ✅ Move download button to bottom and show only after results */}
        <div style={{ textAlign: "center", marginTop: "30px" }}>
          <button onClick={handleDownloadPDF} className="download-button">
            📄 Download PDF Report
          </button>
        </div>
      </div>
    )}
  </div>
);

  
};

export default App;
