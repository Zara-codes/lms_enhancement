export function formatDate(date, format) {
    format = format || "DD-MM-YYYY";
  
    const dateObj = new Date(date);

  
    const day = dateObj.getDate().toString().padStart(2, "0");
    const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
    const year = dateObj.getFullYear().toString();
  
    return format
      .replace(/YYYY/, year)
      .replace(/MM/, month)
      .replace(/DD/, day);
  }

