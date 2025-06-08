export const calculateTimeLeft = (endTime: string | Date): string => {
    const endDate = new Date(endTime);
    const now = new Date();
  
    // Convert the difference to days
    const timeLeftMs = endDate.getTime() - now.getTime();
  
    if (timeLeftMs <= 0) {
      return "Ended";
    }
  
    const days = Math.ceil(timeLeftMs / (1000 * 60 * 60 * 24));
    return days == 1 ? `${days} day left` : `${days} days left`;
  }