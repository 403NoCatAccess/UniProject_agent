package com.qfclass.novelReader.common;

import lombok.Data;

/*返回给页面的数据*/
@Data
public class JSONResult {
    private int code = 200;
    private String msg = "操作成功";
    private long total;
    private long size;
    private long current;

    private long totalPage;

    private Object data;

    public static JSONResult succ() {
        return new JSONResult();
    }

    public static JSONResult succ(Object data) {
        return succ(200, "操作成功", data);
    }

    public static JSONResult succ(int code, String msg, Object data) {
        JSONResult r = new JSONResult();
        r.setCode(code);
        r.setMsg(msg);
        r.setData(data);
        return r;
    }


    public static JSONResult fail(String msg) {
        return fail(400, msg, null);
    }

    public static JSONResult fail(int code, String msg, Object data) {
        JSONResult r = new JSONResult();
        r.setCode(code);
        r.setMsg(msg);
        r.setData(data);
        return r;
    }

    public void setTotalPage(long total, long size) {
        if (total % size == 0) {
            this.totalPage = total / size;
        } else {
            this.totalPage = total / size + 1;
        }
    }
}
