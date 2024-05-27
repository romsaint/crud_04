module.exports = async function (user){
    const complaintsByDay = {
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 0
    };
    
    for (const complaint of user.complaints) {
        const dayOfWeek = new Date(complaint.date).getDay();
        switch (dayOfWeek) {
            case 0:
                complaintsByDay.sunday++;
                break;
            case 1:
                complaintsByDay.monday++;
                break;
            case 2:
                complaintsByDay.tuesday++;
                break;
            case 3:
                complaintsByDay.wednesday++;
                break;
            case 4:
                complaintsByDay.thursday++;
                break;
            case 5:
                complaintsByDay.friday++;
                break;
            case 6:
                complaintsByDay.saturday++;
                break;
        }
    }
    return complaintsByDay
}