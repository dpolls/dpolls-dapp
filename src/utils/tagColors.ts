export const getTagColor = (type: string, value: string): string => {
  if (type === 'status') {
    switch (value) {
      case "new":
        return "#108ee9"; // Blue
      case "for-claiming":
        return "#f50"; // Orange
      case "active":
        return "#52c41a"; // Green
      case "ended":
        return "#722ed1"; // Purple
      case "for-funding":
        return "#faad14"; // Gold
      default:
        return "#87d068"; // Light Green
    }
  } else if (type === 'category') {
    switch (value?.toLowerCase()) {
      case "design":
        return "#eb2f96"; // Pink
      case "tech":
        return "#1890ff"; // Blue
      case "lifestyle":
        return "#13c2c2"; // Cyan
      case "art":
        return "#fa8c16"; // Orange
      case "defi":
        return "#52c41a"; // Green
      case "environment":
        return "#389e0d"; // Dark Green
      case "web3":
        return "#531dab"; // Purple
      case "food":
        return "#d4380d"; // Red
      case "other":
        return "#8c8c8c"; // Gray
      default:
        return "#595959"; // Dark Gray
    }
  }
  return "#595959"; // Default Gray
}; 