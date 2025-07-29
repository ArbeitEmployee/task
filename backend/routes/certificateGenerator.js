const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const uuid = require("uuid");

const generateCertificate = async (data) => {
  const { studentId, courseId, studentName, courseName, completionDate } = data;

  // Create a PDF document
  const doc = new PDFDocument({
    size: "A4",
    layout: "landscape"
  });

  // Generate unique filename
  const filename = `certificate_${studentId}_${courseId}_${uuid.v4()}.pdf`;
  const filePath = path.join(__dirname, "../public/certificates", filename);
  const publicUrl = `/certificates/${filename}`;

  // Ensure certificates directory exists
  if (!fs.existsSync(path.dirname(filePath))) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }

  // Pipe the PDF to a file
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // Add certificate content
  doc.image(path.join(__dirname, "../assets/certificate-bg.jpg"), 0, 0, {
    width: 842,
    height: 595
  });

  doc
    .fontSize(40)
    .font("Helvetica-Bold")
    .text("Certificate of Completion", { align: "center", underline: true });

  doc.moveDown();
  doc.fontSize(24).text("This is to certify that", { align: "center" });

  doc.moveDown();
  doc.fontSize(36).text(studentName, { align: "center" });

  doc.moveDown();
  doc
    .fontSize(20)
    .text(`has successfully completed the course`, { align: "center" });

  doc.moveDown();
  doc.fontSize(28).text(courseName, { align: "center", underline: true });

  doc.moveDown(2);
  doc
    .fontSize(16)
    .text(`Completed on: ${completionDate.toLocaleDateString()}`, {
      align: "center"
    });

  // Finalize the PDF
  doc.end();

  // Wait for the stream to finish writing
  await new Promise((resolve) => stream.on("finish", resolve));

  return publicUrl;
};

module.exports = { generateCertificate };
