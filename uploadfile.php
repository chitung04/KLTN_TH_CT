<?php
    if(isset($_POST['nut']))
    {
        if(isset($_FILES['myfile']) && $_FILES['myfile']['error'] == 0)
        {
            $name = $_FILES['myfile']['name'];
            $tmp_name = $_FILES['myfile']['tmp_name'];
            $file_size = $_FILES['myfile']['size'];
            
            // Thư mục lưu file
            $folder = "uploads/";
            
            // Tạo thư mục nếu chưa tồn tại
            if (!is_dir($folder)) {
                mkdir($folder, 0755, true);
            }
            
            // Các loại file được phép
            $allowed_types = array('image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword');
            $allowed_extensions = array('jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx');
            
            // Kích thước tối đa (5MB)
            $max_size = 5 * 1024 * 1024;
            
            // Lấy extension của file
            $file_ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
            
            // Kiểm tra loại file
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $file_type = finfo_file($finfo, $tmp_name);
            finfo_close($finfo);
            
            // Kiểm tra extension
            if (!in_array($file_ext, $allowed_extensions)) {
                echo "Lỗi: Loại file không được phép! Chỉ được upload: " . implode(', ', $allowed_extensions);
            }
            // Kiểm tra MIME type
            else if (!in_array($file_type, $allowed_types)) {
                echo "Lỗi: Kiểu file không hợp lệ!";
            }
            // Kiểm tra kích thước file
            else if ($file_size > $max_size) {
                echo "Lỗi: File quá lớn! Kích thước tối đa là 5MB";
            }
            else
            {
                // Tạo tên file mới để tránh trùng lặp
                $new_name = time() . '_' . bin2hex(random_bytes(5)) . '.' . $file_ext;
                $path = $folder . $new_name;
                
                // Upload file
                if(move_uploaded_file($tmp_name, $path))
                {
                    echo "Upload file thành công! Tên file: " . $new_name;
                }
                else
                {
                    echo "Upload file không thành công!";
                }
            }
        }
        else
        {
            echo "Vui lòng chọn file!";
        }
    }
?>

<!DOCTYPE html>
<html lang="vi">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Upload File</title>
</head>

<body>

    <form method="POST" enctype="multipart/form-data">

        Mời chọn file cần upload:

        <input type="file" name="myfile">

        <input type="submit" name="nut" value="Tải lên">

    </form>

</body>

</html>