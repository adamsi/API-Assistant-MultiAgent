package iaf.ofek.gisma.ai.util;

public class StringUtils {

    public static String stripWrappers(String str) {
        if (str == null) return null;

        return str.replaceAll("^[\"']+|[\"']+$", "");
    }


}
